import s from '@supabase/supabase-js';
const { SupabaseClient } = s;
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { BgentRuntime, addLore } from '../dist/index.esm.js';
dotenv.config({ path: '.dev.vars' });

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://rnxwpsbkzcugmqauwdax.supabase.co";
const SUPABASE_SERVICE_API_KEY = process.env.SUPABASE_SERVICE_API_KEY;
const SERVER_URL = "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const zeroUuid = '00000000-0000-0000-0000-000000000000';

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_API_KEY);

// The first argument from the command line is the starting path
const startingPath = process.argv[2];

const runtime = new BgentRuntime({
    debugMode: process.env.NODE_ENV === "development",
    supabase,
    serverUrl: SERVER_URL,
    token: OPENAI_API_KEY,
    actions: [],
    evaluators: []
});

// Function to process each Markdown file
const processDocument = async (filePath) => {
    console.log(`Processing file: ${filePath}`);

    // Read the markdown file
    let markdown = await fs.readFile(filePath, 'utf8');
    console.log('markdown:', markdown);

    // Remove the front matter if it exists
    const firstSectionMatch = markdown.match(/^---\s*[\r\n]+([\s\S]+?)[\r\n]+---/);
    markdown = markdown.replace(firstSectionMatch ? firstSectionMatch[0] : '', '').trim();

    // Function to split content by headings and ensure chunks are not too large or empty
    const splitContent = (content, separator) => {
        const sections = content.split(new RegExp(`(?=^${separator})`, 'gm')).filter(Boolean); // Split and keep the separator
        let chunks = [];

        sections.forEach(section => {
            chunks.push(section.trim());
        });

        return chunks;
    };

    // Check for large sections without any headings and split them first
    let chunks = [markdown.replaceAll('\n\n', '\n')];

    // Then, try to split by headings if applicable
    ['# ', '## '].forEach(heading => {
        chunks = chunks.flatMap(chunk => chunk.includes(heading) ? splitContent(chunk, heading) : chunk);
    });

    // For each chunk, handle embedding and saving (this is pseudo-code, adjust based on your actual implementation)
    for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        console.log(`Embedding chunk ${index + 1}/${chunks.length}`);
        console.log('chunk is', chunk)
        // TODO: check if the check exists in the database



        if (chunk) {
            const { data, error } = await supabase.from('lore').select('*').eq('content', chunk);
            if (error) {
                console.error('Error fetching lore:', error);
                return;
            }

            if (data.length === 0) {

                // write to output.log
                // await fs.appendFile('output.log', '***** ' + filePath + '\n\n' + chunk + '\n*****');
                await addLore({ runtime, source: filePath.replace(startingPath, ''), content: chunk, embedContent: chunk });
            }
        }
        // wait for 250 ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('All chunks processed.');
};



// Asynchronous function to recursively find .md files and process them, ignoring specified directories
const findAndProcessMarkdownFiles = async (dirPath) => {
    try {
        const filesAndDirectories = await fs.readdir(dirPath, { withFileTypes: true });

        // Iterate over all items in the directory
        for (const dirent of filesAndDirectories) {
            const fullPath = path.join(dirPath, dirent.name);

            // Skip 'node_modules' and 'static' directories
            if (dirent.isDirectory() && !['node_modules', 'static'].includes(dirent.name)) {
                // If the item is a directory (and not one to ignore), recurse into it
                await findAndProcessMarkdownFiles(fullPath);
            } else if (dirent.isFile() && dirent.name.endsWith('.md') && !dirent.name.includes('README')) {
                // If the item is a file and ends with .md, process it
                await processDocument(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dirPath}: ${error}`);
    }
};

// Main function to kick off the script
const main = async () => {
    // check if accounts contains the default agent
    const { data: accounts, error } = await supabase.from('accounts').select('*').eq('id', zeroUuid);

    if (error) {
        console.error('Error fetching accounts:', error);
        return;
    }

    if (accounts.length === 0) {
        const result = await supabase.from('accounts').upsert({
            id: zeroUuid,
            name: 'Default Agent',
            email: 'default@agent',
            register_complete: true,
            details: {},
        });
    }

    const { data: rooms, error: error2 } = await supabase.from('rooms').select('*').eq('id', zeroUuid);

    if (error2) {
        console.error('Error fetching rooms:', error2);
        return;
    }

    if (rooms.length === 0) {
        const result2 = await supabase.from('rooms').upsert({
            id: zeroUuid,
            name: 'Lore Room',
            created_by: zeroUuid,
        });
    }

    if (!startingPath) {
        console.log('Please provide a starting path as an argument.');
        return;
    }

    console.log(`Searching for Markdown files in: ${startingPath}`);
    await findAndProcessMarkdownFiles(startingPath);
    console.log('Done processing Markdown files.');
};

// Execute the main function
main();
