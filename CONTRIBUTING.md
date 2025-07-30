# Contributing to Swimming Team Optimizer

Thank you for your interest in contributing to the Swimming Team Optimizer! This document provides guidelines and information for contributors.

## Getting Started

### Development Environment Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/swimming-team-optimizer.git
   cd swimming-team-optimizer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Verify Setup**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:5000/api

### Prerequisites

- Node.js 18 or higher
- Python 3.8 or higher
- Basic understanding of TypeScript/React
- Familiarity with swimming terminology (helpful but not required)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/components/    # Reusable UI components
│   ├── src/pages/         # Application pages
│   └── src/lib/          # Utilities and configuration
├── server/                # Express backend
│   ├── optimizer.py      # Python optimization engine
│   ├── routes.ts         # API endpoints
│   └── storage.ts        # Data layer
├── shared/               # Shared TypeScript definitions
└── docs/                # Additional documentation
```

## How to Contribute

### 1. Code Contributions

#### Bug Fixes
- Search existing issues before creating a new one
- Include steps to reproduce the bug
- Provide expected vs actual behavior
- Submit PR with clear description of the fix

#### New Features
- Open an issue to discuss the feature first
- Ensure feature aligns with project goals
- Include tests for new functionality
- Update documentation as needed

#### Code Style
- Follow existing TypeScript/React patterns
- Use meaningful variable and function names
- Add comments for complex optimization logic
- Ensure proper error handling

### 2. Testing

Before submitting changes:

```bash
# Run type checking
npm run type-check

# Test the application flow
npm run dev
# Navigate through all 4 steps of the workflow
```

**Manual Testing Checklist:**
- [ ] File upload works with sample CSV
- [ ] Swimmer availability can be toggled
- [ ] Event assignments can be made
- [ ] Optimization runs without errors
- [ ] Results display correctly

### 3. Documentation

Areas that benefit from documentation improvements:
- API endpoint documentation
- Component prop interfaces
- Algorithm explanation
- Setup instructions for different environments
- Swimming domain knowledge for new contributors

## Contribution Guidelines

### Code Quality

- **TypeScript**: Use proper typing, avoid `any` when possible
- **React**: Follow hooks patterns, use proper dependency arrays
- **Python**: Follow PEP 8 style guide for optimization code
- **Error Handling**: Implement proper error boundaries and validation

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add relay team optimization algorithm
fix: resolve CSV parsing issue for swimmer names
docs: update API endpoint documentation
refactor: simplify event assignment logic
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Keep commits atomic and well-described
   - Test thoroughly before pushing

3. **Submit Pull Request**
   - Clear title and description
   - Reference related issues
   - Include screenshots for UI changes
   - Explain the reasoning behind changes

4. **Review Process**
   - Address reviewer feedback promptly
   - Update documentation if needed
   - Ensure all checks pass

## Development Tips

### Frontend Development
- Use existing shadcn/ui components when possible
- Follow the established design system
- Implement proper loading states for async operations
- Add proper error handling with toast notifications

### Backend Development
- Validate all input data using Zod schemas
- Use proper HTTP status codes
- Implement rate limiting for optimization endpoint
- Add logging for debugging complex optimization issues

### Python Optimization Engine
- Document algorithm complexity and assumptions
- Add type hints where possible
- Handle edge cases (no swimmers, invalid times, etc.)
- Optimize for performance with large datasets

## Common Issues

### Development Environment
- **Port conflicts**: Ensure port 5000 is available
- **Python path**: Verify Python 3 is accessible as `python3`
- **CSV format**: Check sample CSV files in attached_assets/

### Optimization Algorithm
- **Time conversion**: Ensure consistent time format handling
- **Swimmer availability**: Verify availability flags are respected
- **Pre-assignments**: Test that manual assignments are protected

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Code Review**: For feedback on implementation approaches

## Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful in all interactions and follow GitHub's community guidelines.

## Areas for Contribution

High-impact areas where contributions are especially welcome:

### Algorithm Improvements
- Performance optimization for large datasets
- Advanced relay team selection strategies
- Multi-meet season planning algorithms
- Statistical analysis and insights

### User Experience
- Mobile-responsive design improvements
- Accessibility enhancements
- Export format options (Excel, PDF, etc.)
- Undo/redo functionality

### Integration
- Swimming federation database connectors
- Meet management system integrations
- Backup and restore functionality
- Multi-team tournament support

### Testing & Quality
- Automated testing framework
- Performance benchmarking
- Error handling improvements
- Documentation updates

Thank you for contributing to make swimming team management more efficient and effective!