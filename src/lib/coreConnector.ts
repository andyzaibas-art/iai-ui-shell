export async function consent_begin_write(key: string, value: string): Promise<number> {
  await new Promise((r) => setTimeout(r, 200));
  return Math.floor(Math.random() * 1_000_000);
}

export async function mem_commit(nonce: number): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 150));
  void nonce;
  return true;
}

export async function mem_read(key: string): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 150));
  void key;
  return null;
}
