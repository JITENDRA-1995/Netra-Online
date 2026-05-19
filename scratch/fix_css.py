import os

path = r'c:\Users\jadav\Documents\Netra Graphics\src\App.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The corrupted block we found
corrupted = """\
.card-desc {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  color: #ffffff;
  background: #FF4500;
  border-color: #FF4500;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 20px rgba(255, 69, 0, 0.4);
}"""

fixed = """\
.card-desc {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  color: #808080;
  line-height: 1.6;
  margin: 0;
}"""

# Try with different line endings just in case
if corrupted in content:
    content = content.replace(corrupted, fixed)
elif corrupted.replace('\\n', '\\r\\n') in content:
    content = content.replace(corrupted.replace('\\n', '\\r\\n'), fixed)
else:
    # Try a more fuzzy match for the background line inside card-desc
    import re
    # Match .card-desc { ... background: #FF4500; ... }
    pattern = r'\.card-desc\s*\{[^}]*background:\s*#FF4500;[^}]*\}'
    content = re.sub(pattern, fixed, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("CSS Fixed")
