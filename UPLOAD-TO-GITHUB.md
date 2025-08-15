# Upload Files to GitHub - Essential Files Only

**The file is too big because of node_modules and dist folders. Upload only these essential files:**

## Core Files (Upload these first):
1. `package.json` - Dependencies and scripts
2. `package-lock.json` - Dependency versions
3. `netlify.toml` - Deployment configuration  
4. `README.md` - Project documentation
5. `DEPLOYMENT-GUIDE.md` - Deployment instructions
6. `.gitignore` - Ignore large folders

## Source Code Files:
7. `client/` folder (all files inside)
8. `server/` folder (all files inside) 
9. `shared/` folder (all files inside)
10. `public/` folder (all files inside)

## Configuration Files:
11. `vite.config.ts`
12. `tsconfig.json`
13. `tailwind.config.ts`
14. `postcss.config.js`
15. `components.json`
16. `drizzle.config.ts`

## Skip These Large Folders:
- ❌ `node_modules/` (too big, will be rebuilt)
- ❌ `dist/` (too big, will be rebuilt)
- ❌ `attached_assets/` (not needed)
- ❌ `.cache/` (not needed)

## Upload Process:
1. **Create folders first**: client, server, shared, public
2. **Upload files one by one** or in small batches
3. **Use drag & drop** for multiple files at once
4. **Commit message**: "Complete Tonelab Pilates booking platform"

The platform will work perfectly without node_modules and dist - Netlify will rebuild them automatically!