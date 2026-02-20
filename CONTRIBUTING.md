# Contributing to Abyndotxyz

Thank you for your interest in contributing to the Abyndotxyz personal bio template! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug:
1. Check [existing issues](https://github.com/abyn365/abyndotxyz/issues) to see if it's already reported
2. If not, create a new issue with:
   - A clear title and description
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node.js version, browser)
   - Any error messages or logs

### Suggesting Features

We welcome feature suggestions! When suggesting a new feature:
1. Check if a similar feature has been requested
2. Create a new issue with:
   - A clear title
   - Detailed description of the feature
   - Use cases or scenarios where it would be helpful
   - Any examples or mockups if possible

### Pull Requests

We accept pull requests! Here's how to submit one:

#### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/abyndotxyz.git
   cd abyndotxyz
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/abyn365/abyndotxyz.git
   ```

4. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

5. Create a `.env.local` file (see `.env.example` for reference)

6. Start the development server:
   ```bash
   npm run dev
   ```

#### Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes following the code style guidelines

3. Test your changes thoroughly:
   - Run `npm run dev` and test manually
   - Check that existing features still work
   - Test on different screen sizes (responsive design)

4. Commit your changes using conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with Discord status"
   ```

   Commit types:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code refactoring
   - `test`: Adding or updating tests
   - `chore`: Maintenance tasks

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a pull request:
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide a clear title and description
   - Reference any related issues

#### Pull Request Guidelines

- **Keep it focused**: Each PR should focus on one feature or fix
- **Add tests**: If you add new functionality, include tests
- **Update documentation**: Update README, guides, or comments if needed
- **Follow code style**: Maintain consistency with the existing codebase
- **No merge commits**: Rebase your branch before submitting if needed

## 📝 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use proper error handling

### React/Next.js

- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Optimize images with Next.js `<Image />` component
- Use `next/link` for internal navigation

### Tailwind CSS

- Use Tailwind utility classes consistently
- Keep responsive design in mind (mobile-first)
- Use the existing color scheme from `tailwind.config.js`
- Avoid inline styles when possible

### File Organization

- Keep related files in the same directory
- Follow the existing folder structure
- Use descriptive file names
- Separate components from utilities and API routes

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Site loads without errors
- [ ] All features work as expected
- [ ] Responsive design on mobile, tablet, and desktop
- [ ] Discord status displays correctly
- [ ] Spotify integration works (if applicable)
- [ ] Visitor stats update properly (if applicable)
- [ ] No console errors
- [ ] Links work correctly
- [ ] Animations are smooth

### Browser Testing

Test on modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## 📚 Documentation

When making changes:
- Update relevant documentation
- Add comments for complex code
- Update README if adding/removing features
- Update USING.md if changing configuration
- Update guides if modifying integrations

## 🔧 Development Tools

### Linting

The project uses ESLint for code quality:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint -- --fix
```

### Prettier

The project uses Prettier for code formatting:
```bash
npx prettier --write .
```

### Type Checking

Check TypeScript types:
```bash
npx tsc --noEmit
```

## 🎯 Areas That Need Help

Here are some areas where contributions are particularly welcome:

- **Bug fixes**: Help fix reported issues
- **Documentation**: Improve guides and add examples
- **Features**: Add new features or integrations
- **Performance**: Optimize loading and rendering
- **Accessibility**: Improve WCAG compliance
- **Translations**: Add multi-language support

## 💡 Feature Ideas

Looking for something to work on? Consider these feature ideas:

- Theme switcher (light/dark mode)
- Social link redirects
- More animation options
- Additional analytics providers
- More social platform integrations
- Custom domain setup guide
- Deployment guides for other platforms
- Component library documentation

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Acknowledgments

This project is based on the excellent [personal-bio](https://github.com/lrmn7/personal-bio) template by [lrmn7](https://github.com/lrmn7).

## 📞 Getting Help

If you need help with contributing:
- Check the [documentation](https://github.com/abyn365/abyndotxyz)
- Join the [Discord server](https://discord.gg/2pkvB82NaS)
- Create an issue with the "question" label
- Reach out to [@abyn365](https://github.com/abyn365)

## 🌟 Recognition

Contributors will be recognized in:
- The project's contributors list
- Release notes for their contributions
- Special mentions in the README

---

**Thank you for contributing to Abyndotxyz! Your help is greatly appreciated.**

Made with ❤️ by [abyn](https://abyn.xyz)
