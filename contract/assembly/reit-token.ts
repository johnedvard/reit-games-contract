import { ContractPromise } from 'near-sdk-as';
// implementation based on NEP-171
// https://nomicon.io/Standards/NonFungibleToken/Core.html

@nearBindgen
export class TokenMetadata {
  title: string; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string; // free-form description
  media: string; // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash: string; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: string; // number of copies of this set of metadata in existence when token was minted.
  issued_at: string; // When token was issued or minted, Unix epoch in milliseconds
  expires_at: string; // When token expires, Unix epoch in milliseconds
  starts_at: string; // When token starts being valid, Unix epoch in milliseconds
  updated_at: string; // When token was last updated, Unix epoch in milliseconds
  extra: string; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string; // URL to an off-chain JSON file with more info.
  reference_hash: string; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}

@nearBindgen
export class Token {
  id: string;
  owner_id: string;
  metadata: TokenMetadata;
  constructor(token_id: string, metadata: TokenMetadata, receiver_id: string) {
    this.id = token_id;
    this.metadata = metadata;
    this.owner_id = receiver_id;
  }
}

@nearBindgen
export class ReitToken {
  token: Token;

  constructor(token_id: string, metadata: TokenMetadata, receiver_id: string) {
    this.token = { id: token_id, metadata: metadata, owner_id: receiver_id };
  }

  // --- view methods --- //

  nft_token(): Token {
    return this.token;
  }

  // --- change methods --- //

  nft_transfer_call(
    receiver_id: string,
    token_id: string,
    approval_id: number,
    memo: string,
    msg: string
  ): ContractPromise {
    // assert(false, 'nft_transfer_call not implemented');
    return ContractPromise.create('', '', {}, 1);
  }
}
