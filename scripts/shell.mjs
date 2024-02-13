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
dotenv.config()

// check args for --dev
const args = process.argv.slice(2)
const dev = args.includes('--dev')

const SUPABASE_URL = process.env.SERVER_URL || "https://pronvzrzfwsptkojvudd.supabase.co"
const SUPABASE_ANON_KEY = process.env.SERVER_URL || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb252enJ6ZndzcHRrb2p2dWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4NTYwNDcsImV4cCI6MjAyMjQzMjA0N30.I6_-XrqssUb2SWYg5DjsUqSodNS3_RPoET3-aPdqywM"
// check for --debug flag in 'node example/shell --debug'
const SERVER_URL =
  process.env.SERVER_URL || dev
    ? 'http://localhost:7998'
    : 'https://cojourney.shawmakesmagic.workers.dev'

// YOU WILL NEED TO REPLACE THIS
const agentUUID = '00000000-0000-0000-0000-000000000000'

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

export const getMe = async (session) => {
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

// Main application logic
// Main application logic
async function startApplication () {
  console.log(chalk.green('Starting application...'))

  // Assuming session information is stored in the .cjrc file
  const userData = JSON.parse(fs.readFileSync(configFile).toString())
  const session = userData?.session
  const supabase = getSupabase(session?.access_token)

  const userId = session.user?.id

  // get all entries from 'rooms' where there are two particants (entries in the partipants table) where the user and agent ids match the participant user_id field
  // this will require a join between the rooms and participants table
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `*,
    relationships(
      *,
      userData1:accounts!relationships_user_a_fkey(
        *
      ),
      userData2:accounts!relationships_user_b_fkey(
        *
      ),
      actionUserData:accounts!relationships_user_id_fkey(
        *
      )
    ),
    participants!inner(
      *,
      userData:accounts(
        *
      )
    )
    `
    )
    .filter('participants.user_id', 'eq', userId)

  if (error) {
    console.error('Error fetching room data', error)
    return
  }

  // get the room_id from the data
  const room_id = data[0].id
  supabase.realtime.accessToken = session?.access_token // THIS IS REQUIRED FOR RLS!!!

  // Listen to the 'messages' table for new messages in the specific room
  const channel = supabase
    .channel('table-db-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        // TODO: should filter by room_id at some point
        if (!payload.new.room_id || payload.new.room_id !== room_id) return

        const { new: newMessage } = payload
        const { user_id, content } = newMessage

        // Determine the message sender
        const color = user_id === userId ? 'blue' : 'green'
        console.log(
          chalk[color](
            `${user_id === userId ? 'You' : 'Agent'}: ${content.content}`
          )
        )
      }
    )
    .subscribe()

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
        content,
        agentId: agentUUID,
        room_id
      })
    })

    rl.prompt(true)
  }

  console.log(chalk.green('Application started. You can now start chatting.'))

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

  console.log(chalk.yellow('Press Ctrl+C to exit.'))

  process.on('SIGINT', cleanup) // Modified to use the cleanup function
}

// Function to handle user login or signup
async function handleUserInteraction () {
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
      chalk.green('Configuration file found. You are already logged in.')
    )
    await startApplication() // Start the application if already logged in
  }
}

// Function to log in the user
async function loginUser () {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (error) throw error

    fs.writeFileSync(configFile, JSON.stringify({ session: data.session }))
    console.log(chalk.green('Login successful! Configuration saved.'))
    await startApplication() // Start the application after login
  } catch (error) {
    console.error(chalk.red(`Login failed: ${error.message}`))
  }
}

// Function to sign up the user
async function signupUser () {
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
