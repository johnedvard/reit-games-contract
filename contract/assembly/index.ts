import { PersistentMap, context } from 'near-sdk-as';
import { Token, TokenMetadata } from './reit-token';
import { User } from './user';

@nearBindgen
class NFTContractMetadata {
  spec: string; // required, essentially a version like "nft-1.0.0"
  name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string; // required, ex. "MOCHI"
  icon: string | null; // Data URL
  base_uri: string | null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference: string | null; // URL to a JSON file with more info
  reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}

@nearBindgen
export class Contract {
  private userMap: PersistentMap<string, User> = new PersistentMap<
    string,
    User
  >('users');

  setProfileImageSrc(profileImageSrc: string): string {
    const username = context.sender;
    const user: User = this.getOrInitUser(username);
    user.profileImageSrc = profileImageSrc;
    this.userMap.set(username, user);
    return profileImageSrc;
  }

  getProfileImageSrc(username: string): string {
    return this.getOrInitUser(username).profileImageSrc;
  }

  private getOrInitUser(username: string): User {
    if (this.userMap.contains(username)) {
      return this.userMap.getSome(username);
    } else {
      const user = new User(username);
      this.userMap.set(username, user);
      return user;
    }
  }

  // nft testing

  //keeps track of the metadata for the contract
  metadata: NFTContractMetadata = {
    spec: 'reit-token-0.0.0',
    name: 'Reit Token',
    symbol: 'REIT',
    icon: null,
    base_uri: null,
    reference: null,
    reference_hash: null,
  };

  //contract owner
  owner_id: string;

  //keeps track of all the token IDs for a given account
  tokens_per_owner: PersistentMap<string, Array<string>> = new PersistentMap<
    string,
    Array<string>
  >('tokens_pr_owner');

  //keeps track of the token struct for a given token ID
  tokens_by_id: PersistentMap<string, Token> = new PersistentMap<string, Token>(
    'tokens_by_id'
  );

  //keeps track of the token metadata for a given token ID
  token_metadata_by_id: PersistentMap<string, TokenMetadata> =
    new PersistentMap<string, TokenMetadata>('token_metadata_by_id');

  nft_tokens_for_owner(account_id: string): Array<Token> {
    const tokenIds: string[] = this.tokens_per_owner.getSome(account_id);

    const tokens: Array<Token> = new Array<Token>();
    for (let i = 0; i < tokenIds.length; ++i) {
      const token: Token = this.tokens_by_id.getSome(tokenIds[i]);
      tokens.push(token);
    }
    return tokens;
  }

  nft_mint(
    token_id: string,
    metadata: TokenMetadata,
    receiver_id: string
  ): void {
    // assert(
    //   this.tokens_by_id.contains(token_id),
    //   'ID is already taken, create new ID'
    // );
    const token = new Token(token_id, metadata, receiver_id);
    const tokens: Array<string> = new Array<string>();
    tokens.push(token_id);
    this.tokens_per_owner.set(receiver_id, tokens);
    this.tokens_by_id.set(token_id, token);
    this.token_metadata_by_id.set(token_id, token.metadata);
  }
}
