# Slack Clone - Real-time Team Communication App

A modern, feature-rich Slack clone built with Vue 3, Nuxt 3, and TypeScript. This project demonstrates real-time communication capabilities with a comprehensive set of features for team collaboration.

## 🚀 Features

- 📡 **Real-time Communication** - Instant messaging with live updates
- 👍 **Message Reactions** - React to messages with emojis
- 🧵 **Threads & Replies** - Organize conversations with threaded discussions
- ✏️ **Message Editing** - Edit your messages after sending
- 🗑️ **Message Deletion** - Remove messages when needed
- 🔐 **Role-based Access Control** - Manage workspace members
- 🖼️ **Image Attachments** - Share images in conversations
- 📺 **Channel Creation** - Create and share channels
- 🏢 **Workspace Management** - Multi-workspace support
- ✉️ **Invite System** - Invite users via shareable codes
- 💬 **Direct Messaging** - Private one-on-one conversations
- 👥 **User Profiles** - Customizable user profiles
- 🎨 **Modern UI** - Beautiful interface with Shadcn UI and Tailwind CSS
- 🚀 **Vercel Deployment**

## 🛠️ Tech Stack

- **Frontend**: Vue 3, Nuxt 3, TypeScript
- **Database**: Convex (real-time database)
- **Authentication**: Session-based email/password + GitHub OAuth
- **UI Framework**: Shadcn UI, Tailwind CSS
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Convex account (free tier available)
- GitHub OAuth App (for GitHub authentication)
- Vercel account (for deployment)

## 🏗️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sytanta/nuxt-slack.git
   cd nuxt-slack
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Convex**

   ```bash
   npx convex dev
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Convex
   CONVEX_DEPLOYMENT=your-convex-deployment-url
   CONVEX_URL=your-convex-url

   # GitHub OAuth
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   NUXT_PUBLIC_HOMEPAGE_URL=http://localhost:3000
   NUXT_PUBLIC_AUTH_CALLBACK_URL_GITHUB=http://localhost:3000/auth/github/callback

   NUXT_PUBLIC_MESSAGE_PER_PAGE=10
   NUXT_PUBLIC_TIME_THRESHOLD=5
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Convex Setup

1. Create a new Convex project at [convex.dev](https://convex.dev)
2. Install the Convex CLI: `npm install -g convex`
3. Initialize Convex in your project: `npx convex dev`

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**

   - Push your code to GitHub
   - Import the project in Vercel dashboard

2. **Configure environment variables**

   - Add all environment variables from your `.env` file
   - Update `NUXT_PUBLIC_HOMEPAGE_URL` & `NUXT_PUBLIC_AUTH_CALLBACK_URL_GITHUB` to your production domain

3. **Deploy Convex to production**

   - Please follow this page to deploy Convex to your selected hosting provider [Convex deployment](https://docs.convex.dev/production/hosting/)

4. **Update Convex environment variables**

   - Add `CONVEX_DEPLOY_KEY` from step 3
   - Update `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` in Vercel
   - Add the remaining variables

5. **Set build command**

   - It should be `npx convex deploy --cmd 'npm run build'`

6. **Update GitHub OAuth setting**
   - `Homepage URL` and `Authorization callback URL` should be pointed to your newly deployed website domain

```
## 🔒 Authentication

The app supports two authentication methods:

1. **Email/Password**: Traditional session-based authentication
2. **GitHub OAuth**: Social login with GitHub

User sessions are managed securely with encrypted session tokens. You can add more OAuth providers as needed.
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Learning Resources

This project is based on this comprehensive tutorial:

- [YouTube Tutorial](https://www.youtube.com/watch?v=lXITA5MZIiI) - Complete walkthrough of building this Slack clone

## 🐛 Issues

- Mobile responsiveness needs more work
- Hydration mismatch warnings from Reka UI
- Error messages from API and Convex are not displayed properly

## 🔮 Future Enhancements

- Voice/Video calling integration
- File sharing beyond images
- Advanced search functionality
- Message scheduling
- Custom emoji support
- Dark/Light theme toggle

## 💡 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/sytanta/nuxt-slack/issues) page
2. Create a new issue with detailed description

---

**Happy coding! 🚀**
