import { Secret } from 'jwt-promisify'
declare global{
    namespace NodeJS{
        interface ProcessEnv{
            JWT_SECRET: Secret,
            NODE_ENV: 'development' | 'production',
            PORT:number,
            DATABASE_URI:string,
            USER_NAME:string,
            PASSWORD:string
        }
    }
}

export {}