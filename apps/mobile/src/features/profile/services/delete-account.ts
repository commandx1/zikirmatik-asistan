// B-6: hesap silme akışı — sunucu silme başarısızsa oturum KORUNUR (signOut
// çağrılmaz) ve çağıran hatayı gösterir; modal açık kalır.
export type DeleteAccountDeps = {
  deleteUser: (userId: string) => Promise<unknown>;
  signOut: () => Promise<void>;
};

export async function runDeleteAccount(userId: string, { deleteUser, signOut }: DeleteAccountDeps): Promise<{ ok: boolean }> {
  try {
    await deleteUser(userId);
  } catch {
    return { ok: false };
  }
  await signOut();
  return { ok: true };
}
