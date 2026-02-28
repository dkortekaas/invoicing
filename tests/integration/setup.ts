import { config } from 'dotenv'
import path from 'path'

// Load .env.test before any test file is evaluated so that module-level
// process.env reads (e.g. the SKIP guard) see the correct values.
config({ path: path.resolve(process.cwd(), '.env.test') })
