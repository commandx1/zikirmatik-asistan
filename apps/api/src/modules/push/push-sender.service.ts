import { Injectable, Logger } from '@nestjs/common';
import Expo, {
  type ExpoPushMessage,
  type ExpoPushTicket,
} from 'expo-server-sdk';
import { DevicesService } from '../devices/devices.service';
import type { PushMessage, PushSendResult, PushTarget } from './push.types';

@Injectable()
export class PushSenderService {
  private readonly logger = new Logger(PushSenderService.name);
  private readonly expo = new Expo();

  constructor(private readonly devicesService: DevicesService) {}

  // Reusable public API for future callers (e.g. a Phase 2 scheduler): send
  // one message to a batch of device targets, then do a best-effort receipt
  // check so devices with a dead token stop being targeted next time.
  async sendToDevices(
    targets: PushTarget[],
    message: PushMessage,
  ): Promise<PushSendResult> {
    const { messages, ticketDeviceIds } = this.buildMessages(targets, message);
    const skippedCount = targets.length - messages.length;

    if (messages.length === 0) {
      return {
        sentCount: 0,
        skippedCount,
        ticketErrorCount: 0,
        deactivatedDeviceIds: [],
      };
    }

    const tickets = await this.sendChunks(messages);
    const deactivatedDeviceIds = await this.processReceipts(
      tickets,
      ticketDeviceIds,
    );
    const ticketErrorCount = tickets.filter(
      (ticket) => ticket.status === 'error',
    ).length;

    return {
      sentCount: tickets.length - ticketErrorCount,
      skippedCount,
      ticketErrorCount,
      deactivatedDeviceIds,
    };
  }

  private buildMessages(targets: PushTarget[], message: PushMessage) {
    const messages: ExpoPushMessage[] = [];
    const ticketDeviceIds: string[] = [];

    for (const target of targets) {
      if (!Expo.isExpoPushToken(target.expoPushToken)) {
        this.logger.warn(
          `Skipping device ${target.deviceId}: not a valid Expo push token.`,
        );
        continue;
      }

      messages.push({
        to: target.expoPushToken,
        title: message.title,
        body: message.body,
        data: message.data,
      });
      ticketDeviceIds.push(target.deviceId);
    }

    return { messages, ticketDeviceIds };
  }

  private async sendChunks(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (error) {
        this.logger.error(
          'Failed to send an Expo push notification chunk.',
          error as Error,
        );
        // Keep ticket/deviceId indices aligned even when a chunk fails
        // outright, so the caller can still map remaining tickets correctly.
        tickets.push(
          ...chunk.map(() => ({
            status: 'error' as const,
            message: 'send-failed',
          })),
        );
      }
    }

    return tickets;
  }

  // Tickets with status "error" and error "DeviceNotRegistered" are dead
  // immediately (no receipt round-trip needed). Successful tickets carry a
  // receipt id we can check for the same error surfacing later.
  private async processReceipts(
    tickets: ExpoPushTicket[],
    ticketDeviceIds: string[],
  ) {
    const deadDeviceIds = new Set<string>();
    const receiptIdToDeviceId = new Map<string, string>();

    tickets.forEach((ticket, index) => {
      const deviceId = ticketDeviceIds[index];
      if (!deviceId) {
        return;
      }

      if (ticket.status === 'error') {
        if (ticket.details?.error === 'DeviceNotRegistered') {
          deadDeviceIds.add(deviceId);
        }
        return;
      }

      receiptIdToDeviceId.set(ticket.id, deviceId);
    });

    const receiptIds = [...receiptIdToDeviceId.keys()];
    if (receiptIds.length > 0) {
      const receiptChunks =
        this.expo.chunkPushNotificationReceiptIds(receiptIds);
      for (const chunk of receiptChunks) {
        try {
          const receipts =
            await this.expo.getPushNotificationReceiptsAsync(chunk);
          for (const [receiptId, receipt] of Object.entries(receipts)) {
            if (
              receipt.status === 'error' &&
              receipt.details?.error === 'DeviceNotRegistered'
            ) {
              const deviceId = receiptIdToDeviceId.get(receiptId);
              if (deviceId) {
                deadDeviceIds.add(deviceId);
              }
            }
          }
        } catch (error) {
          // Receipts may not be ready yet (Expo needs time to deliver to
          // APNs/FCM) — this is best-effort cleanup, not a hard requirement.
          this.logger.warn(
            `Could not fetch Expo push receipts for this chunk: ${(error as Error).message}`,
          );
        }
      }
    }

    if (deadDeviceIds.size > 0) {
      await this.devicesService.deactivateByIds([...deadDeviceIds]);
    }

    return [...deadDeviceIds];
  }
}
