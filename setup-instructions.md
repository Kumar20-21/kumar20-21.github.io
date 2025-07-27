# Modern Personal Portfolio Website Setup Guide

This guide will help you create a modern, professional personal portfolio website using React, TypeScript, and Tailwind CSS, deployable on GitHub Pages.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- GitHub account

### Step 1: Create the Project

```bash
# Create new Vite project with React + TypeScript
npm create vite@latest my-portfolio -- --template react-ts
cd my-portfolio

# Install dependencies
npm install

# Install additional dependencies
npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
npm install framer-motion lucide-react @headlessui/react

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Step 2: Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
```

### Step 3: Update CSS Files

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 inline-flex items-center gap-2;
  }
  
  .btn-secondary {
    @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-lg transition-all duration-200 inline-flex items-center gap-2;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700;
  }
  
  .section-padding {
    @apply py-20 px-6 sm:px-8 lg:px-12;
  }
}
```

### Step 4: Project Structure

Create the following folder structure:

```
src/
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Projects.tsx
│   ├── Publications.tsx
│   ├── Blog.tsx
│   ├── Contact.tsx
│   ├── ThemeToggle.tsx
│   └── common/
│       ├── Card.tsx
│       ├── Button.tsx
│       └── Section.tsx
├── hooks/
│   ├── useTheme.ts
│   └── useScrollSpy.ts
├── types/
│   └── index.ts
├── data/
│   └── portfolio.ts
├── utils/
│   └── constants.ts
├── App.tsx
├── main.tsx
└── index.css
```

### Step 5: Core Component Files

#### `src/types/index.ts`
```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: string;
  type: 'conference' | 'journal' | 'workshop';
  url?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  url?: string;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  email: string;
  bio: string;
  location: string;
  university: string;
}
```

#### `src/data/portfolio.ts`
```typescript
import { PersonalInfo, Project, Publication, BlogPost, Education } from '../types';

export const personalInfo: PersonalInfo = {
  name: "Your Name",
  title: "Research Fellow & Full Stack Developer",
  tagline: "Building intelligent systems at the intersection of AI and finance",
  email: "your.email@example.com",
  bio: "I am a researcher and developer focused on machine learning, reinforcement learning, and quantitative finance. Currently pursuing cutting-edge research in artificial intelligence applications.",
  location: "Your Location",
  university: "Your University"
};

export const education: Education[] = [
  {
    degree: "Ph.D. in Computer Science",
    institution: "Your University",
    period: "2022 - Present",
    description: "Specializing in Machine Learning and Quantitative Finance"
  },
  {
    degree: "M.Sc. in Computer Science",
    institution: "Previous University", 
    period: "2019 - 2021",
    description: "Focus on Deep Learning and Computer Vision"
  },
  {
    degree: "B.Sc. (Hons.) in Computer Science",
    institution: "Undergraduate University",
    period: "2016 - 2019", 
    description: "Foundation in Computer Science and Programming"
  }
];

export const projects: Project[] = [
  {
    id: "conference-deadlines",
    title: "Conference Deadlines Tracker",
    description: "A comprehensive deadline tracking system for academic conferences and journals in reinforcement learning and quantitative finance. Features real-time countdown, filtering by venue type, and automatic updates.",
    image: "/project-conference-deadlines.jpg",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    liveUrl: "https://kumar20-21.github.io/conference_dealines/",
    githubUrl: "https://github.com/Kumar20-21/conference_dealines", 
    featured: true
  },
  {
    id: "rl-trading-agent",
    title: "RL Trading Agent",
    description: "Deep reinforcement learning agent for algorithmic trading using PPO and transformer architectures. Implemented backtesting framework with risk management.",
    image: "/project-rl-trading.jpg",
    technologies: ["Python", "PyTorch", "NumPy", "Pandas"],
    githubUrl: "#",
    featured: true
  },
  {
    id: "portfolio-optimization",
    title: "Portfolio Optimization Suite", 
    description: "Modern portfolio theory implementation with machine learning enhancements. Features risk-return optimization and factor model analysis.",
    image: "/project-portfolio-opt.jpg",
    technologies: ["Python", "Scipy", "Matplotlib", "Jupyter"],
    githubUrl: "#",
    featured: false
  }
];

export const publications: Publication[] = [
  {
    id: "drl-portfolio",
    title: "Deep Reinforcement Learning for Portfolio Management",
    authors: ["Your Name", "Co-Author 1", "Co-Author 2"],
    venue: "Conference on Machine Learning (Sample)",
    year: "2024",
    type: "conference"
  },
  {
    id: "multiagent-finance",
    title: "Multi-Agent Systems in Financial Markets", 
    authors: ["Your Name", "Co-Author 1"],
    venue: "Journal of AI Research (Sample)",
    year: "2023",
    type: "journal"
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: "rl-finance-intro", 
    title: "Getting Started with Reinforcement Learning in Finance",
    excerpt: "An introduction to applying RL techniques to financial decision making...",
    date: "2024-01-15",
    readTime: "8 min read"
  },
  {
    id: "ml-pipelines",
    title: "Building Scalable ML Pipelines",
    excerpt: "Best practices for deploying machine learning models in production...", 
    date: "2023-12-10",
    readTime: "12 min read"
  }
];

export const skills = [
  "Python", "TypeScript", "React", "PyTorch", "TensorFlow", 
  "Docker", "AWS", "Git", "Node.js", "PostgreSQL"
];

export const socialLinks = {
  github: "https://github.com/yourusername",
  linkedin: "https://linkedin.com/in/yourprofile",
  twitter: "https://twitter.com/yourhandle", 
  orcid: "https://orcid.org/0000-0000-0000-0000"
};
```

#### `src/hooks/useTheme.ts`
```typescript
import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};
```

#### `src/components/Header.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'publications', label: 'Publications' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => scrollToSection('home')}
              className="text-2xl font-bold text-primary-600 dark:text-primary-400"
            >
              YN
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
```

### Step 6: Configure for GitHub Pages Deployment

#### Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/your-repository-name/', // Replace with your repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

#### Create `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### Install gh-pages:
```bash
npm install --save-dev gh-pages
```

### Step 7: GitHub Repository Setup

1. Create a new repository on GitHub
2. Clone and setup:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### Step 8: Deploy to GitHub Pages

#### Method 1: Using gh-pages package
```bash
npm run deploy
```

#### Method 2: Using GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 9: Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" in the sidebar
3. Select "GitHub Actions" as the source
4. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

## 🎨 Customization Guide

### Colors
Update colors in `tailwind.config.js` under `theme.extend.colors`

### Fonts
Add new fonts in `index.css` and update `tailwind.config.js`

### Content
Update `src/data/portfolio.ts` with your information

### Images
Add images to `public/` folder and reference them in your data

## 📝 Content Guidelines

1. **Professional Photo**: Add a high-quality headshot
2. **Project Screenshots**: Include compelling project images
3. **Real Content**: Replace all placeholder content with your actual information
4. **SEO**: Update meta tags in `index.html`
5. **Favicon**: Add your custom favicon in the `public/` folder

## 🚀 Performance Tips

1. **Image Optimization**: Use WebP format for images
2. **Lazy Loading**: Implement lazy loading for images
3. **Bundle Analysis**: Use `npm run build -- --analyze`
4. **Lighthouse**: Test with Google Lighthouse for performance optimization

## 🔧 Troubleshooting

### Common Issues:

1. **Blank Page**: Check `base` path in `vite.config.ts`
2. **404 on Refresh**: Add `404.html` that redirects to `index.html`
3. **Images Not Loading**: Ensure correct path references
4. **Build Failures**: Check TypeScript errors

### Debug Steps:
```bash
# Test locally
npm run build
npm run preview

# Check build output
ls -la dist/
```

This setup provides a modern, professional portfolio website that's fast, responsive, and easy to maintain. The code is well-structured with TypeScript for type safety and Tailwind for consistent styling.