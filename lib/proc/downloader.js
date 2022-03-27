
const DIFFICULTY_HARD = 'Hard';
const DIFFICULTY_EXPERT = 'Expert';
const DIFFICULTY_EXPERT_PLUS = 'Expert+';
const MAP_FORMAT_V2 = 'V2';
const MAP_FORMAT_V2_FLOW = 'V2-Flow (Better flow, less creative)';
const GAMEMODE_STANDARD = 'Standard';
const GAMEMODE_90_DEGREES = '90 Degrees';
const GAMEMODE_NO_ARROWS = 'No Arrows';
const EVENT_BOMBS = 'Bombs';
const EVENT_DOTBLOCKS = 'Dot Blocks';
const EVENT_OBSTACLES = 'Obstacles';

const args = JSON.parse(JSON.stringify(process.argv[3])); // don't ask
const url = process.argv[2];
const path = require('path');
const puppeteer = require('puppeteer');
const extract = require('extract-zip');
const WindowsBalloon = require('node-notifier').WindowsBalloon;
const { v4: uuidv4 } = require('uuid');
const fs = require('graceful-fs');
const { readdirSync, mkdirSync, rmSync } = fs
const notifier = new WindowsBalloon({
  withFallback: false, // Try Windows Toast and Growl first?
  customPath: undefined // Relative/Absolute path if you want to use your fork of notifu
});

const { modifiers, mapFormat, folder } = JSON.parse(args);

function hasModifier(modifier) {
    return modifiers.indexOf(modifier) !== -1;
}
function hasMapFormat(format) {
    return mapFormat.indexOf(format) !== -1;
}

async function openBrowser() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://beatsage.com/');

    return {browser, page};
}

async function extractArchive(uuid, folderName) {
    try {
        const name = folderName.replace('|', '_');
        const fileList = readdirSync(`./downloads/${uuid}`);
        const filepath = `${path.join(process.cwd(), `./downloads/${uuid}`, fileList[0])}`;
        const destination = path.join(`${folder}/Beat Saber_Data/CustomLevels/${name}_${uuid}`);
    
    
        fs.mkdirSync(destination, {recursive: true});
        await extract(filepath, {dir: destination});
    
        // rmSync(path.join(`${process.cwd()}`, `./downloads/${uuid}/${name}`), {recursive: true, force: true});
        rmSync(path.join(`${process.cwd()}`, `./downloads/${uuid}`), {recursive: true, force: true});
    
        notifier.notify({
            title: 'BeatSage Downloader',
            message: `${name} installed successfully`,
            sound: true
        });
    } catch(ex) {
        return notifier.notify({
            title: 'BeatSage Downloader',
            message: `${folderName} failed to install`,
            sound: true
        });
    }
}

async function setGameModes(page) {
    if (!hasModifier(GAMEMODE_STANDARD)) {
        await page.click('input[value="Standard"]');
    }

    if (!hasModifier(GAMEMODE_90_DEGREES)) {
        await page.click('input[value="90Degree"]');
    }

    if (hasModifier(GAMEMODE_NO_ARROWS)) {
        await page.click('input[value="NoArrows"]');
    }
}
async function setDifficulty(page) {
    if (!hasModifier(DIFFICULTY_HARD)) {
        await page.click('input[value="Hard"]');
    }
    if (!hasModifier(DIFFICULTY_EXPERT)) {
        await page.click('input[value="Expert"]');
    }
    if (hasModifier(DIFFICULTY_EXPERT_PLUS)) {
        await page.click('input[value="ExpertPlus"]');
    }
}
async function setSongEvents(page) {
    if (!hasModifier(EVENT_DOTBLOCKS)) {
        await page.click('input[value="DotBlocks"]');
    }
    if (!hasModifier(EVENT_OBSTACLES)) {
        await page.click('input[value="Obstacles"]');
    }
    if (hasModifier(EVENT_BOMBS)) {
        await page.click('input[value="Bombs"]');
    }
}

async function downloadSong(url, mapFormatType) {
    const uuid = uuidv4();
    const {browser, page} = await openBrowser();

    await page.type('.is-grouped .paste input', url);
    await page.click('.control.search button');
    await page.waitForSelector('.is-primary figure');
    
    const titleElement = await page.$('.media-content .field:nth-child(2) input');
    const titleText = await page.evaluate(titleElement => titleElement.value, titleElement);
    const name = (`${titleText} [${mapFormatType === MAP_FORMAT_V2_FLOW ? 'V2-FLOW' : 'V2'}]`).replace('|', '_');

    notifier.notify({
        title: 'BeatSage Downloader',
        message: `${name} is now downloading`,
        sound: true
    })

    await page.evaluateHandle(() => document.querySelector('.media-content .field:nth-child(2) input').value = "");
    await page.evaluateHandle((flow) => document.querySelector('.model-options .column:nth-child(2) select').selectedIndex = (flow ? 1 : 0), mapFormatType === MAP_FORMAT_V2_FLOW);
    await page.type('.media-content .field:nth-child(2) input', (mapFormatType === MAP_FORMAT_V2_FLOW ? `${titleText} [V2 FLOW]` : `${titleText} [V2]`));

    await setDifficulty(page);
    await setGameModes(page);
    await setSongEvents(page);

    await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(`./downloads/${uuid}`) 
    });

    await page.evaluateHandle(() => document.querySelector('div.enclosing').__vue__.$listeners.slashed());

    await page.waitForTimeout(3000);
    await page.waitForSelector('.card.download', { timeout: 500000, visible: true });
    await page.waitForSelector('.card.download .manual-download a.is-light', { timeout: 500000, visible: true });
    await page.click('.card.download .manual-download a.is-light');

    await page.waitForTimeout(3000);
    await extractArchive(uuid, name);

    await browser.close();
}

async function startDownload() {
    if (hasMapFormat(MAP_FORMAT_V2)) {
        downloadSong(url, MAP_FORMAT_V2);
    }

    if (hasMapFormat(MAP_FORMAT_V2_FLOW)) {
        downloadSong(url, MAP_FORMAT_V2_FLOW);
    }
}


(async () => {
    try {
        if (!url) return;
        await startDownload();
    } catch(ex) {
        return;
    }
})();
