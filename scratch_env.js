console.log(Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GOOGLE') || k.includes('STRIPE') || k.includes('GEMINI') || k.includes('PORT')));
