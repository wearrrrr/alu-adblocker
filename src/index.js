const { Engine, RuleStorage, StringRuleList, Request } = require("@adguard/tsurlfilter");

let engine = undefined;

self.adblockExt = {};

async function init() {
    return new Promise(async (resolve, reject) => {
        let lists = [
            {
                url: "/blocklist?url=https%3A%2F%2Fgithub.com%2Feasylist%2Feasylist%2Fraw%2Fmaster%2Feasyprivacy%2Feasyprivacy_general.txt",
                title: "EasyPrivacy",
            },
            {
                url: "/blocklist?url=https%3A%2F%2Fgithub.com%2Fjerryn70%2FGoodbyeAds%2Fraw%2Fmaster%2FFormats%2FGoodbyeAds-AdBlock-Filter.txt",
                title: "GoodbyeAds-Adblock-Filter",
            },
            {
                url: "/blocklist?url=https%3A%2F%2Fgithub.com%2Fjerryn70%2FGoodbyeAds%2Fraw%2Fmaster%2FFormats%2FGoodbyeAds-YouTube-AdBlock-Filter.txt",
                title: "GoodbyeAds-YouTube-AdBlock-Filter",
            },
        ]
    
        let parsedLists = [];
        let index = 0;
    
        for (let list of lists) {
            const text = await fetch(list.url).then(response => response.text());
            console.log("Fetched blocklist " + list.title)
            index++;
            const ruleList = new StringRuleList(index, text, false, false);
            parsedLists.push(ruleList);
        }

        try {
            const ruleStorage = new RuleStorage(parsedLists);
            engine = new Engine(ruleStorage);
            resolve();
        } catch {
            console.error("Failed to fetch blocklists.");
            reject();
        }
    });
}

async function filterRequest(fetchEvent) {
    if (!fetchEvent.request.url.includes("/service/")) {
        return;
    }
    if (!(engine instanceof Engine) || engine === undefined) {
        await init();
    }

    const url = fetchEvent.request.url.includes("/service/") ? self.__uv$config.decodeUrl(fetchEvent.request.url.split("/service/")[1]) : fetchEvent.request.url
    const request = new Request(url);
    const result = engine.matchRequest(request);
    if (result.basicRule !== null) {
        if (fetchEvent.workerware.config.debug) {
            console.log("Blocking request to " + url + " because of rule " + result.basicRule.ruleText);
        }
        return null;
    }
    return result;
}

self.adblockExt.filterRequest = filterRequest;