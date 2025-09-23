# EmotiLink OS Installation Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- npm 8+
- Git

### 2. Installation

```bash
# Clone repository
git clone https://github.com/emotilink-os/emotilink-os.git
cd emotilink-os

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your configuration

# Compile contracts
npm run compile

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🧪 Testing

```bash
# Run smart contract tests
npm run test:contracts

# Run frontend tests
npm run test

# Compile contracts
npm run compile
```

## 🔧 Troubleshooting

### Common Issues

- **Node.js Version**: Ensure Node.js 18+ is installed
- **Dependencies**: Clear cache and reinstall if needed
- **Environment**: Check `.env` file configuration
- **Network**: Verify Alchemy API key and network settings

---

**Installation Guide Version**: 1.0  
**Compatible with**: EmotiLink OS v1.0.0