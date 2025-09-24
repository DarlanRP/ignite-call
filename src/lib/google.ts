import { google } from 'googleapis'
import { prisma } from './prisma'
import dayjs from 'dayjs'

export async function getGoogleOAuthToken(userId: string) {
  const account = await prisma.account.findFirstOrThrow({
    where: {
      provider: 'google',
      user_id: userId,
    },
  })

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : null,
  })

  // Se não tem expiry, já retorna
  if (!account.expires_at) {
    return auth
  }

  const isTokenExpired = dayjs(account.expires_at * 1000).isBefore(new Date())

  if (isTokenExpired) {
    try {
      const { credentials } = await auth.refreshAccessToken() // ou use getAccessToken()
      const {
        access_token,
        expiry_date,
        id_token,
        refresh_token,
        scope,
        token_type,
      } = credentials

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token,
          expires_at: expiry_date ? Math.floor(expiry_date / 1000) : null,
          id_token,
          // refresh_token pode ser null (Google não manda sempre)
          refresh_token: refresh_token ?? account.refresh_token,
          scope,
          token_type,
        },
      })

      auth.setCredentials({
        access_token,
        refresh_token: refresh_token ?? account.refresh_token,
        expiry_date,
      })
    } catch (err) {
      console.error('Erro ao renovar token do Google:', err)
      throw new Error('Google OAuth token inválido, reconecte sua conta')
    }
  }

  return auth
}
