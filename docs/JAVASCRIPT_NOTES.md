# JavaScript vs TypeScript Note

**Important**: This guide now uses **JavaScript** for the backend code examples.

## What Changed

- All `.ts` files are now `.js` files
- Using `require()` instead of `import`
- Using `module.exports` instead of `export`
- No type annotations (`: string`, `: Promise<T>`, etc.)
- No TypeScript-specific configuration

## Frontend (Next.js)

For the frontend, you can choose:

- **JavaScript**: Use the `--js` flag when creating the Next.js app
- **TypeScript**: Use the `--typescript` flag (frontend examples remain TypeScript for now)

The frontend examples are still in TypeScript in later phases, but you can easily adapt them:

**TypeScript:**

```typescript
interface User {
  id: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  // ...
};
```

**JavaScript:**

```javascript
const getUser = async (id) => {
  // Returns a user object
  // ...
};
```

## Why This Is Fine

- ✅ JavaScript works identically to TypeScript at runtime
- ✅ You learn the same concepts (Express, Prisma, WebRTC, etc.)
- ✅ Can always add TypeScript later if you want type safety
- ✅ Less syntax to learn upfront

## If You Want TypeScript Later

Just change the file extension from `.js` to `.ts` and add type annotations gradually!
