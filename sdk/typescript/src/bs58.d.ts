declare module "bs58" {
  const base58: {
    decode(value: string): Uint8Array;
    encode(value: Uint8Array): string;
  };
  export default base58;
}
