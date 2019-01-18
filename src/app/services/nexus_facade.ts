import { NexusService } from './nexus.service';
import { Injectable } from '@angular/core';

@Injectable()
export class NexusFacade {
    constructor(private nexus: NexusService){}

    async getServices(){
        let userTags = await this.nexus.UserGetTags("web.nexus-dashboard");

        console.log("TAGS: ", userTags)
        if (userTags && userTags.tags && userTags.tags.services){
            return Object.keys(userTags.tags.services)
        }
        return []
    }
}