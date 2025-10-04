# My Food Palette 🍽️

A food recommendation application that helps users discover restaurants and menu items based on their preferences. Built with React, TanStack Router, and Supabase Edge Functions.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Documentation](#documentation)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```
   Verify installation:
   ```bash
   supabase --version
   ```

4. **Git** (for version control)
   ```bash
   git --version
   ```

## 📁 Project Structure

```
my-food-palette/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── routes/          # TanStack Router routes
│   │   ├── lib/             # Shared utilities (Supabase client)
│   │   └── ...
│   ├── package.json
│   └── README.md            # Frontend-specific documentation
├── supabase/                # Supabase backend
│   ├── functions/           # Edge Functions
│   │   └── fetchSuggestions/
│   └── README.md            # Supabase-specific documentation
├── get-supabase-keys.sh     # Helper script to get API keys
└── README.md                # This file
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd my-food-palette
```

### 2. Set Up Supabase

#### Option A: Use Existing Production Project

```bash
# Login to Supabase
supabase login

# Link to your production project
supabase link --project-ref <your-project-ref>

# Get your production keys
./get-supabase-keys.sh prod
```

Copy the output to `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Option B: Use Local Development

```bash
# Start local Supabase instance
supabase start

# Get local keys
./get-supabase-keys.sh
```

Copy the output to `frontend/.env`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5174/` (or another port if 5174 is in use).

## 🛠️ Development Setup

### Detailed Steps

#### 1. Supabase Authentication

If you haven't already, create a Supabase account and login via CLI:

```bash
supabase login
```

This will open a browser window for authentication.

#### 2. Link Your Project

If you have an existing Supabase project:

```bash
cd /path/to/my-food-palette
supabase link --project-ref <your-project-ref>
```

Find your project ref in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/[your-project-ref]`

#### 3. Deploy Edge Functions (Production)

To deploy the `fetchSuggestions` function to production:

```bash
supabase functions deploy fetchSuggestions
```

#### 4. Test Locally with Local Supabase

Start local Supabase services:

```bash
supabase start
```

This will start:
- PostgreSQL database
- API server
- Auth server
- Storage server
- Edge Functions runtime

Serve functions locally:

```bash
supabase functions serve
```

Or serve a specific function:

```bash
supabase functions serve fetchSuggestions
```

## ⚙️ Environment Configuration

### Frontend Environment Variables

Create a `frontend/.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Getting Your Keys

Use the provided helper script:

**For local development:**
```bash
./get-supabase-keys.sh
```

**For production:**
```bash
./get-supabase-keys.sh prod
```

The script will output the keys in the correct format. Copy them to your `frontend/.env` file.

### Environment Files

- `frontend/.env` - Your local environment variables (gitignored)
- `frontend/.env.example` - Template showing required variables

## 📜 Available Scripts

### Frontend Scripts

From the `frontend/` directory:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Supabase Scripts

From the project root:

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy fetchSuggestions

# View function logs (production)
supabase functions logs fetchSuggestions

# Serve functions locally
supabase functions serve
```

### Helper Scripts

```bash
# Get local Supabase keys
./get-supabase-keys.sh

# Get production Supabase keys
./get-supabase-keys.sh prod
```

## 📚 Documentation

### Additional Documentation

- **[Frontend Documentation](./frontend/README.md)** - React, Vite, and ESLint configuration
- **[Router Setup](./frontend/ROUTER_SETUP.md)** - TanStack Router configuration and usage
- **[Supabase Documentation](./supabase/README.md)** - Edge Functions and Supabase CLI commands

### Key Technologies

- **Frontend:**
  - [React 19](https://react.dev/) - UI library
  - [TypeScript](https://www.typescriptlang.org/) - Type safety
  - [Vite](https://vite.dev/) - Build tool
  - [TanStack Router](https://tanstack.com/router) - Type-safe routing

- **Backend:**
  - [Supabase](https://supabase.com/) - Backend as a Service
  - [Edge Functions](https://supabase.com/docs/guides/functions) - Serverless functions
  - [Deno](https://deno.land/) - Runtime for Edge Functions

## 🌐 Available Routes

Once the development server is running, you can access:

- **`/`** - Home page with the default Vite + React demo
- **`/test-fetchsuggestions`** - Test page for the `fetchSuggestions` Edge Function

## 🧪 Testing the Application

### Test the Edge Function

1. Navigate to `http://localhost:5174/test-fetchsuggestions`
2. Click the "Fetch Suggestions" button
3. View the formatted results or expand the raw JSON

The function currently returns hard-coded example data showing restaurant suggestions with matching menu items.

## 🚀 Deployment

### Deploy to Vercel

This project includes a `vercel.json` configuration file for easy deployment to Vercel.

#### Quick Deploy

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect the `vercel.json` configuration

3. **Set Environment Variables:**
   
   Get your production Supabase keys:
   ```bash
   ./get-supabase-keys.sh prod
   ```
   
   Add these in Vercel's project settings:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

4. **Deploy!** 🎉
   
   Vercel will automatically build and deploy your app.

#### Manual Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy Edge Functions

Deploy your Supabase Edge Functions separately:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy fetchSuggestions
```

### Other Deployment Options

**Netlify:**
- Similar process to Vercel
- Set build command: `cd frontend && npm install && npm run build`
- Set publish directory: `frontend/dist`
- Add environment variables in Netlify dashboard

**Cloudflare Pages:**
- Connect your GitHub repository
- Set build command: `cd frontend && npm install && npm run build`
- Set build output directory: `frontend/dist`
- Add environment variables in Cloudflare dashboard

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**

If you see CORS errors when calling Edge Functions, ensure your function includes the correct headers:

```typescript
'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey'
```

**2. Supabase Not Running**

If you get "Supabase is not running" errors:

```bash
supabase start
```

**3. Port Already in Use**

If port 5173/5174 is in use, Vite will automatically try the next available port. Check the terminal output for the actual URL.

**4. Environment Variables Not Loading**

- Ensure your `.env` file is in the `frontend/` directory
- Restart the dev server after changing `.env` files
- Variable names must start with `VITE_` to be exposed to the client

**5. Function Deployment Fails**

Ensure you're logged in and linked to a project:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- The `VITE_SUPABASE_ANON_KEY` is safe to expose in client-side code
- Never expose the `service_role` key in client-side code
- Use Row Level Security (RLS) policies in Supabase for data protection

## 📝 Next Steps

1. **Customize the UI** - Modify the routes in `frontend/src/routes/`
2. **Add More Functions** - Create new Edge Functions in `supabase/functions/`
3. **Set Up Database** - Add tables and RLS policies in Supabase
4. **Deploy Frontend** - Deploy to Vercel, Netlify, or your preferred platform
5. **Configure CI/CD** - Set up automated deployments

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test locally
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Check the [TanStack Router Documentation](https://tanstack.com/router/latest)
- Review the additional documentation in this repository

---

**Happy coding! 🚀**
