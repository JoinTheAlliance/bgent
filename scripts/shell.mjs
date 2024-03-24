#!/usr/bin/env node

// Import necessary modules
import dotenv from 'dotenv'
import path from 'path'
import { homedir } from 'os'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import inquirer from 'inquirer'
import chalk from 'chalk'
import readline from 'readline'
import figlet from 'figlet'

dotenv.config()

// check args for --dev
const args = process.argv.slice(2)
const dev = args.includes('--dev')

const zeroUuid = "00000000-0000-0000-0000-000000000000";

const SUPABASE_URL = process.env.SERVER_URL || "https://ffqphwtgkfxrifwtlmyk.supabase.co"
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcXBod3Rna2Z4cmlmd3RsbXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ1MDIwMDUsImV4cCI6MjAyMDA3ODAwNX0.3ddcMBVpvphTlWOK4i7rg-Qh8Eabhzrwq_5akCE6di0"
// check for --debug flag in 'node example/shell --debug'
const SERVER_URL =
  process.env?.SERVER_URL ?? dev
    ? 'http://localhost:7998'
    : 'https://cojourney.shawmakesmagic.workers.dev'

// Setup environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

// Define user home directory and config file path
const userHomeDir = homedir()
const configFile = path.join(userHomeDir, '.cjrc')

const getSupabase = (access_token) => {
  const supabaseUrl = SUPABASE_URL
  const supabaseAnonKey = SUPABASE_ANON_KEY
  const options = {}

  if (access_token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, options)
  return supabase
}

const getMe = async (session) => {
  const {
    data: { user },
    error
  } = await getSupabase(session?.access_token).auth.getUser()
  if (error) {
    await getSupabase(session?.access_token).auth.signOut()
    console.log('*** error', error)
    return null
  } else {
    return user
  }
}

const checkAndUpdateAccount = async (user) => {
  const supabase = getSupabase(user.access_token)
  const response = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
  let { data: accounts, error: accountsError } = response
  if (accountsError) {
    console.error(chalk.red(`Failed to fetch accounts: ${accountsError.message}`))
    return
  }

  if (accounts.length === 0) {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter your name:',
        validate: (input) => input.trim() !== '' || 'Name cannot be empty.'
      }
    ])

    const { error: insertError } = await supabase
      .from('accounts')
      .insert([{ id: user.id, name, email: user.email }])

    if (insertError) {
      console.error(chalk.red(`Failed to create account: ${insertError.message}`))
    } else {
      console.log(chalk.green('Account created successfully.'))
    }
  }
}

async function loginUser(retry = false) {
  if (retry) {
    console.log(chalk.yellow('Incorrect email or password. Please try again.'))
  }

  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email:',
      validate: (input) => input.includes('@') || 'Please enter a valid email address.'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      mask: '*'
    }
  ])

  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  })

  const { session } = data;

  if (error) {
    await loginUser(true) // Recursively call loginUser to retry
  } else {
    fs.writeFileSync(configFile, JSON.stringify({ session }))
    console.log(chalk.green('Login successful! Configuration saved.'))
    await startApplication() // Start the application after login
  }
}


async function startApplication() {
  figlet("bgent", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(chalk.cyan(data) + '\n');
  });

  // Assuming session information is stored in the .cjrc file
  const userData = JSON.parse(fs.readFileSync(configFile).toString())
  const session = userData.session
  await checkAndUpdateAccount(session.user) // Check and update account after login

  const supabase = getSupabase(session.access_token)

  // supabase.realtime.accessToken = session.access_token // THIS IS REQUIRED FOR RLS!!!
  console.log('supabase.realtime.accessToken', supabase.realtime.accessToken)
  // Listen to the 'memories' table for new messages in the specific room
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public'
      },
      (payload) => {
        // TODO: should filter by room_id at some point
        // if (!payload.new.room_id || payload.new.room_id !== room_id) return
        // if (payload.new.type !== 'message') return

        const { new: newMessage } = payload
        const { user_id, content } = newMessage

        // Determine the message sender
        const color = user_id !== zeroUuid ? 'blue' : 'green'
        console.log(
          chalk[color](
            `${user_id !== zeroUuid ? 'You' : 'Agent'}: ${content.content}`
          )
        )
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error('Subscription error:', err);
      } else {
        console.log('Subscription status:', status);
      }
    });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  })

  // Send the user's message
  const message = async (content) => {
    await fetch(SERVER_URL + '/api/agents/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.access_token
      },
      body: JSON.stringify({
        content: { content, action: "WAIT" },
        user_id: session.user.id,
      })
    })

    rl.prompt(true)
  }

  console.log(chalk.green('Application started. You can now start chatting.') + ' ' + chalk.yellow('Press Ctrl+C to exit.'))

  process.stdin.resume()
  readline.emitKeypressEvents(process.stdin)

  rl.on('line', (input) => {
    message(input)
    rl.prompt(true)
  }).on('SIGINT', () => {
    rl.close()
  })

  // Initial prompt
  rl.prompt(true)

  // Cleanup on exit
  const cleanup = () => {
    channel.unsubscribe()
    rl.close()
    process.exit() // Forcefully exits the process
  }

  process.on('SIGINT', cleanup) // Modified to use the cleanup function
}

// Function to handle user login or signup
async function handleUserInteraction() {
  let user

  if (fs.existsSync(configFile)) {
    // try to read the file as json
    const userData = JSON.parse(fs.readFileSync(configFile).toString())
    const session = userData?.session
    user = await getMe(session)
  }

  if (!user) {
    console.log(chalk.yellow('Please log in or sign up.'))
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Do you want to login or signup?',
        choices: ['Login', 'Signup']
      }
    ])

    if (action === 'Login') {
      await loginUser()
    } else if (action === 'Signup') {
      await signupUser()
    }
  } else {
    console.log(
      chalk.yellow('Configuration file found at ~/.cjrc. You are already logged in.')
    )
    await startApplication()
  }
}

// Function to sign up the user
async function signupUser() {
  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email:',
      validate: (input) =>
        input.includes('@') ? true : 'Please enter a valid email address.'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      mask: '*'
    }
  ])

  const supabase = getSupabase()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password
    })

    if (error) throw error

    fs.writeFileSync(configFile, JSON.stringify({ session: data.session }))
    console.log(chalk.green('Signup successful! Configuration saved.'))
    await startApplication() // Start the application after signup
  } catch (error) {
    console.error(chalk.red(`Signup failed: ${error.message}`))
  }
}

handleUserInteraction()
