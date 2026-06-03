type UnsavedTransitionInput = {
  selectedDhikrId: string;
  targetDhikrId?: string;
  unsavedProgressDhikrIds: string[];
};

export function shouldConfirmUnsavedDhikrTransition(input: UnsavedTransitionInput) {
  if (!input.selectedDhikrId) {
    return false;
  }

  if (input.targetDhikrId && input.targetDhikrId === input.selectedDhikrId) {
    return false;
  }

  return input.unsavedProgressDhikrIds.includes(input.selectedDhikrId);
}
