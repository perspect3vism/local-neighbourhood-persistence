import type { Address, Expression, ExpressionAdapter, PublicSharing, LanguageContext, AgentService } from "@perspect3vism/ad4m";
import type { IPFS } from "ipfs-core-types";
import path from "path";
import fs from "fs";

class SharedPerspectivePutAdapter implements PublicSharing {
  #agent: AgentService;
  #IPFS: IPFS
  #storagePath: string;

  constructor(context: LanguageContext) {
    this.#agent = context.agent;
    this.#IPFS = context.IPFS;
    if ("storagePath" in context.customSettings) { this.#storagePath = context.customSettings["storagePath"] } else { this.#storagePath = "./src/test-temp/" };
  }

  async createPublic(neighbourhood: object): Promise<Address> {
    const expression = this.#agent.createSignedExpression(neighbourhood);
    const content = JSON.stringify(expression);
    const result = await this.#IPFS.add({ content }, { onlyHash: true });
    const address = result.cid.toString();

    const neighbourhoodPath = path.join(this.#storagePath, `neighbourhood-${address}.json`);
    console.log("Writing neighbourhood with path: ", neighbourhoodPath);
    fs.writeFileSync(neighbourhoodPath, content);

    return address
  }
}

export default class Adapter implements ExpressionAdapter {
  #IPFS: IPFS
  #storagePath: string;

  putAdapter: PublicSharing;

  constructor(context: LanguageContext) {
    this.putAdapter = new SharedPerspectivePutAdapter(context);
    if ("storagePath" in context.customSettings) { this.#storagePath = context.customSettings["storagePath"] } else { this.#storagePath = "./src/test-temp/" };
  }

  async get(address: Address): Promise<Expression> {
    const neighbourhoodPath = path.join(this.#storagePath, `neighbourhood-${address}.json`)
    if (fs.existsSync(neighbourhoodPath)) {
      const neighbourhood = JSON.parse(fs.readFileSync(neighbourhoodPath).toString());
      console.log("Found neighbourhood: ", neighbourhood);
      return neighbourhood
    } else {
      return null
    } 
  }
}
