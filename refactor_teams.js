const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern 1: Basic select ID
    // const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user?.id || '').single();
    if (content.includes("await supabase.from('organizations').select('id').eq('owner_id'")) {
        content = content.replace(
            /(const|let)\s+\{\s*data:\s*org(\s*,\s*error)?\s*\}\s*=\s*await\s+supabase\s*\.from\('organizations'\)\s*\.select\('id'\)\s*\.eq\('owner_id',\s*(.*?)\)\s*\.maybeSingle\(\);/g,
            "const { data: teamMembership$2 } = await supabase.from('team_members').select('org_id').eq('user_id', $3).maybeSingle();\n    const org = teamMembership ? { id: teamMembership.org_id } : null;"
        );
        content = content.replace(
            /(const|let)\s+\{\s*data:\s*org(\s*,\s*error)?\s*\}\s*=\s*await\s+supabase\s*\.from\('organizations'\)\s*\.select\('id'\)\s*\.eq\('owner_id',\s*(.*?)\)\s*\.single\(\);/g,
            "const { data: teamMembership$2 } = await supabase.from('team_members').select('org_id').eq('user_id', $3).single();\n    const org = teamMembership ? { id: teamMembership.org_id } : null;"
        );
        changed = true;
    }

    if (changed && content !== fs.readFileSync(file, 'utf8')) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated simple org fetch in:", file);
        count++;
    }
}
console.log("Updated basic patterns in files:", count);
