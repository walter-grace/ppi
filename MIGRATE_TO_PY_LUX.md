# Migrating Python Code to py-lux Repository

This guide helps you move all Python code from the `ppi` (Next.js chatbot) repo to the new `py-lux` repository.

## Files to Move

### Root Level Python Files
- `amazon_explorer.py`
- `app.py`
- `chatbot_mcp.py`
- `psa_card_arbitrage.py`
- `setup_ebay_oauth.py`
- `streamlit_chatbot.py`
- `test_*.py` (all test files)

### Python Folders
- `lib/` (Python files only - keep TypeScript files in ppi)
- `scanners/`
- `reports/`
- `templates/`
- `archive/`
- `data/`

### Configuration Files
- `requirements.txt`

## Setup py-lux Repository

1. **Create the py-lux repository on GitHub** (if not already created)

2. **Navigate to a new directory for py-lux:**
   ```bash
   cd ..
   mkdir py-lux
   cd py-lux
   ```

3. **Initialize git:**
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/walter-grace/py-lux.git
   ```

4. **Copy Python files from ppi to py-lux:**
   ```bash
   # From the py-lux directory
   cp -r ../psa/lib/*.py ./lib/  # Copy Python files from lib/
   cp ../psa/*.py .  # Copy root Python files
   cp -r ../psa/scanners ./
   cp -r ../psa/reports ./
   cp -r ../psa/templates ./
   cp -r ../psa/archive ./
   cp -r ../psa/data ./
   cp ../psa/requirements.txt ./
   ```

5. **Create .gitignore for py-lux:**
   ```gitignore
   # Python
   __pycache__/
   *.py[cod]
   *$py.class
   *.so
   .Python
   venv/
   env/
   ENV/

   # Data files (generated)
   data/*.csv
   data/*.json
   data/*.html

   # IDE
   .vscode/
   .idea/
   *.swp
   *.swo

   # OS
   .DS_Store
   Thumbs.db

   # Environment
   .env
   .env.local
   ```

6. **Create README.md for py-lux:**
   ```markdown
   # py-lux

   Python libraries and tools for luxury item arbitrage analysis.

   ## Features
   - eBay API integration
   - PSA API integration
   - Watch database integration
   - Arbitrage analysis
   - Report generation
   ```

7. **Commit and push:**
   ```bash
   git add .
   git commit -m "Initial commit: Python luxury arbitrage tools"
   git push -u origin main
   ```

## After Migration

Once Python files are moved to py-lux:

1. **Commit the removal in ppi repo:**
   ```bash
   cd ../psa  # Back to ppi repo
   git add .
   git commit -m "Remove Python code - moved to py-lux repo"
   git push
   ```

2. **Verify ppi repo only has Next.js files:**
   - ✅ `app/` - Next.js app
   - ✅ `components/` - React components
   - ✅ `lib/*.ts` - TypeScript libraries
   - ✅ `package.json` - Node.js dependencies
   - ❌ No `.py` files
   - ❌ No `requirements.txt`

## Notes

- Python files are still in your local `psa` directory (not deleted)
- They're just removed from git tracking in the ppi repo
- Copy them to py-lux before deleting locally (if desired)

