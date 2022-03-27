#!/usr/bin/env node

const path = require('path');
const inquirer = require('inquirer');
const agent = require(path.resolve(__dirname, './lib/proc/agent'));
const WindowsBalloon = require('node-notifier').WindowsBalloon;
const notifier = new WindowsBalloon({
    withFallback: false, // Try Windows Toast and Growl first?
    customPath: undefined // Relative/Absolute path if you want to use your fork of notifu
});

// ask for v2/v2 flow types
// (loop) => ask for YT URL and fork a downloader proc / back to asking for YT
// GUI? Codename: GUI Budder Cake

async function loopInput(opts) {
    agent.init(opts);

    notifier.notify({
        title: 'BeatSage Downloader',
        message: 'The downloader is ready. Your settings will be applied to every song. URL(s) will be queued. Please be patient.',
        sound: true
    });

    while (true) {
        await inquirer.prompt([
            {
                name: 'urlInput',
                type: 'text',
                message: 'URL: '
            }
        ])
        .then(agent.updateQueue);
    }
}

(async () => {
    await inquirer.prompt([
        {
            name: 'folder',
            type: 'text',
            message: 'Confirm BeatSaber folder',
            default() {
                return 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Beat Saber';
            }
        },
        {
            name: 'modifiers',
            type: 'checkbox',
            message: 'Select modifiers',
            choices: [
                new inquirer.Separator(' = Map Difficulty = '),
                {
                    name: 'Normal',
                },
                {
                    name: 'Hard',
                },
                {
                    name: 'Expert',
                    checked: true
                },
                {
                    name: 'Expert+',
                    checked: true
                },
                new inquirer.Separator(' = Game Modes = '),
                {
                    name: 'Standard',
                    checked: true
                },
                {
                    name: 'No Arrows',
                },
                {
                    name: '90 Degrees',
                },
                new inquirer.Separator(' = Song Events = '),
                {
                    name: 'Bombs',
                },
                {
                    name: 'Dot Blocks',
                },
                {
                    name: 'Obstacles',
                },
            ]
        },
        {
            type: 'checkbox',
            message: 'Select BeatSaber map format(s)',
            name: 'mapFormat',
            choices: [
                {
                    name: 'V2',
                    checked: true,
                },
                {
                    name: 'V2-Flow (Better flow, less creative)'
                }
            ],
            validate(choices) {
                if (choices.length < 1) {
                    return "You must pick at least one map format"
                }
    
                return true;
            }
        }
    ]).then(loopInput);
})();

