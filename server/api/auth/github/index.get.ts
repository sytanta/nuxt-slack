export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize?` +
    `client_id=${config.public.githubClientId}&` +
    `redirect_uri=${encodeURIComponent(config.public.authCallbackGitHub)}&` +
    `scope=user:email&` +
    `state=${query.state}`;

  return sendRedirect(event, githubAuthUrl);
});
