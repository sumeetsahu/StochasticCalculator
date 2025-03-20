# Hosting on GitHub Pages

This document provides step-by-step instructions for hosting the Retirement Corpus Stochastic Calculator web application on GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your computer
- Basic knowledge of git commands

## Setup Instructions

### 1. Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name your repository (e.g., `retirement-calculator`)
4. Choose whether to make it public or private
5. Click "Create repository"

### 2. Push the Web Files to GitHub

You can either push just the web directory (if you want to host only the web version) or the entire project.

**Option 1: Push only the web directory**

```bash
# Navigate to the web directory
cd web

# Initialize a new Git repository
git init

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit of web application"

# Add your GitHub repository as remote
git remote add origin https://github.com/your-username/your-repository-name.git

# Push to GitHub
git push -u origin main
```

**Option 2: Push the entire project**

```bash
# Navigate to the project root
cd /path/to/StochasticCalculator

# Initialize a new Git repository
git init

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit of Stochastic Calculator project"

# Add your GitHub repository as remote
git remote add origin https://github.com/your-username/your-repository-name.git

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select the branch you want to deploy (usually `main`)
5. If you pushed the entire project, select `/docs` as the folder, and make sure to move the web contents to a folder named `docs`
6. If you pushed only the web directory, select the root folder (`/`)
7. Click "Save"

GitHub will provide you with a URL where your site is published (typically `https://your-username.github.io/your-repository-name/`).

### 4. Custom Domain (Optional)

If you want to use a custom domain:

1. In the GitHub Pages section of repository settings, enter your custom domain
2. Create a CNAME file in your web directory with your domain name
3. Configure your domain's DNS settings according to GitHub's instructions

## Automatic Deployment with GitHub Actions

The provided GitHub Actions workflow file (`.github/workflows/gh-pages-deploy.yml`) will automatically deploy your site whenever you push changes to the main branch.

This workflow:
1. Checks out your repository
2. Sets up GitHub Pages
3. Uploads the contents of the web directory
4. Deploys to GitHub Pages

The workflow assumes your web files are in a directory named `web`. If you renamed this directory, update the `path` parameter in the workflow file.

## Troubleshooting

- If your site isn't publishing, check the Actions tab in your repository to see if there are any workflow errors
- Make sure your repository visibility settings match your GitHub Pages settings
- For custom domains, ensure your DNS settings are correct and have propagated

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Configuring a custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
