# Deployment Guide: Golf Handicap Calculator

This guide will walk you through deploying your Golf Handicap Calculator to Vercel using Supabase as the database.

## Prerequisites

- GitHub account
- Vercel account (linked to GitHub)
- Supabase account with project: `https://supabase.com/dashboard/project/bfhlpicxwuftctjzqyhe`

## Step 1: GitHub Repository Setup

1. Go to GitHub.com and create a new repository
2. Name it something like `golf-handicap-calculator`
3. Don't initialize with README (we already have our code)
4. Copy the repository URL

Then push your local code:

```bash
git remote add origin https://github.com/[YOUR_USERNAME]/golf-handicap-calculator.git
git branch -M main
git push -u origin main
```

## Step 2: Supabase Database Setup

1. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard/project/bfhlpicxwuftctjzqyhe
   - Click on "Settings" → "Database"
   - Copy the "Connection string" (it should look like):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.bfhlpicxwuftctjzqyhe.supabase.co:5432/postgres
     ```

2. **Important:** Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Vercel Deployment

1. **Connect GitHub to Vercel:**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables:**
   During deployment, add these environment variables:

   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.bfhlpicxwuftctjzqyhe.supabase.co:5432/postgres
   SECRET_KEY=your-super-secret-key-change-this-in-production
   FLASK_ENV=production
   UPLOAD_FOLDER=/tmp/uploads
   MAX_CONTENT_LENGTH=16777216
   ```

3. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically detect the configuration from `vercel.json`

## Step 4: Database Initialization

After successful deployment:

1. Your app will automatically create the database tables on first run
2. Sample courses will be added automatically
3. The app will be accessible at your Vercel URL (something like `https://golf-handicap-calculator-xyz.vercel.app`)

## Step 5: Verify Deployment

Visit your deployed app and test:

1. ✅ Home page loads
2. ✅ Can add a golfer
3. ✅ Can add a course
4. ✅ Can record a score
5. ✅ Handicap calculations work

## File Upload Configuration

**Note:** In the Vercel serverless environment, file uploads work differently:
- Profile pictures are stored in `/tmp/uploads` (temporary storage)
- Files are lost between function invocations
- For production, consider using Supabase Storage or AWS S3

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Check that your Supabase project is active
- Ensure the password in the connection string is correct

### App Not Loading
- Check Vercel function logs in the dashboard
- Verify all environment variables are set
- Make sure `api/index.py` exists

### Template/Static File Issues
- Verify the paths in `api/index.py` point to `../templates` and `../static`
- Check that all template files are present in the repository

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Supabase | `postgresql://postgres:password@db.xyz.supabase.co:5432/postgres` |
| `SECRET_KEY` | Flask secret key for sessions | `your-super-secret-key` |
| `FLASK_ENV` | Flask environment | `production` |
| `UPLOAD_FOLDER` | Directory for uploaded files | `/tmp/uploads` |
| `MAX_CONTENT_LENGTH` | Max file upload size in bytes | `16777216` (16MB) |

## Post-Deployment

### Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Update DNS records as instructed

### Monitoring
- Check Vercel function logs for errors
- Monitor Supabase database usage
- Set up alerts for errors

## Local Development

To run locally with the same configuration:

1. Copy `env.example` to `.env`
2. Fill in your actual values
3. Run: `python app.py`

The app will run on `http://localhost:5001`

## Updating the App

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Vercel will automatically redeploy

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Supabase connection
3. Review environment variables
4. Check the GitHub repository structure matches the expected layout 