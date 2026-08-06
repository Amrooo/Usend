const fs = require('fs');

let content = fs.readFileSync('src/components/LoginModal.tsx', 'utf8');

// Replace defaultRole dependencies with selectedRole
content = content.replace(
  /const \[email, setEmail\] = useState\(''\);/,
  "const [email, setEmail] = useState('');\n  const [selectedRole, setSelectedRole] = useState(defaultRole);"
);

content = content.replace(
  /  \/\/ Auto-fill values for easiest evaluation but secure validation\n  React\.useEffect\(\(\) => \{\n    if \(isOpen\) \{\n      setError\(null\);\n      setPassword\(''\);\n      if \(defaultRole === 'admin'\) \{\n        setEmail\('admin@usend\.com'\);\n      \} else if \(defaultRole === 'merchant'\) \{\n        setEmail\('merchant@usend\.com'\);\n      \} else if \(defaultRole === 'user'\) \{\n        setEmail\('user@usend\.com'\);\n      \} else if \(defaultRole === 'driver'\) \{\n        setEmail\('driver@usend\.com'\);\n      \}\n    \}\n  \}, \[isOpen, defaultRole\]\);/,
  `  // Auto-fill values for easiest evaluation but secure validation
  React.useEffect(() => {
    if (isOpen) {
      setSelectedRole(defaultRole);
    }
  }, [isOpen, defaultRole]);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword('');
      if (selectedRole === 'admin') {
        setEmail('admin@usend.com');
      } else if (selectedRole === 'merchant') {
        setEmail('merchant@usend.com');
      } else if (selectedRole === 'user') {
        setEmail('user@usend.com');
      } else if (selectedRole === 'driver') {
        setEmail('driver@usend.com');
      }
    }
  }, [isOpen, selectedRole]);`
);

// We need to inject the role selector UI before the form
const formStart = "{/* Login Form */}\n            <form onSubmit={handleSubmit} className=\"space-y-4\">";
const roleSelector = `
            {selectedRole !== 'admin' && (
              <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedRole('merchant')}
                  className={\`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all \${selectedRole === 'merchant' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={\`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all \${selectedRole === 'user' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  User
                </button>
              </div>
            )}
`;

content = content.replace(formStart, roleSelector + formStart);

fs.writeFileSync('src/components/LoginModal.tsx', content, 'utf8');
