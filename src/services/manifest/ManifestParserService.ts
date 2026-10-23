export interface ManifestFileRef {
  name: string;
  category: 'core' | 'template' | 'client' | 'other';
  relativePath: string;
  description?: string;
  clientName?: string;
}

export interface ParsedManifest {
  title: string;
  cardinalRules: string[];
  files: ManifestFileRef[];
}

export class ManifestParserService {
  /**
   * Parse MASTER_MANIFEST.md content
   */
  static parse(content: string): ParsedManifest {
    const cardinalRules: string[] = [];
    const files: ManifestFileRef[] = [];
    
    const lines = content.split('\n');
    let currentSection: 'rules' | 'core' | 'templates' | 'clients' | null = null;
    let currentClient: string | undefined = undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Section headers detection
      if (line.includes('## 🚨 CARDINAL SYSTEM RULES')) {
        currentSection = 'rules';
        continue;
      } else if (line.includes('## 🧠 1. DYNAMIC SYSTEM CORE')) {
        currentSection = 'core';
        continue;
      } else if (line.includes('## 📋 2. REUSABLE LEGAL TEMPLATES')) {
        currentSection = 'templates';
        continue;
      } else if (line.includes('## 📁 3. ACTIVE CLIENT RECORDS')) {
        currentSection = 'clients';
        continue;
      } else if (line.startsWith('##') || line.startsWith('#')) {
        // Reset section for other headings
        currentSection = null;
        continue;
      }

      // Parse line according to current section
      if (currentSection === 'rules') {
        if (line.startsWith('-') || line.startsWith('*')) {
          const ruleText = line.replace(/^[-*]\s*/, '').trim();
          cardinalRules.push(ruleText);
        }
      } else if (currentSection === 'core') {
        // Parse table row: | Category | Description | Path |
        if (line.startsWith('|') && !line.includes('Category') && !line.includes(':---')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 4) {
            const categoryName = parts[1].replace(/\*\*/g, '');
            const description = parts[2];
            const pathLink = parts[3];
            
            const pathMatch = pathLink.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (pathMatch) {
              const relPath = pathMatch[2].replace(/^\.\//, '').replace(/\\/g, '/');
              files.push({
                name: categoryName,
                category: 'core',
                relativePath: relPath,
                description
              });
            }
          }
        }
      } else if (currentSection === 'templates') {
        if (line.startsWith('-') || line.startsWith('*')) {
          const text = line.replace(/^[-*]\s*/, '').trim();
          const nameMatch = text.match(/^\*\*([^*:]+)(?::\*\*)?/);
          const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
          
          if (linkMatch) {
            const name = nameMatch ? nameMatch[1].trim() : linkMatch[1];
            const relPath = linkMatch[2].replace(/^\.\//, '').replace(/\\/g, '/');
            files.push({
              name,
              category: 'template',
              relativePath: relPath
            });
          }
        }
      } else if (currentSection === 'clients') {
        if (line.startsWith('- **') || line.startsWith('* **')) {
          const text = line.replace(/^[-*]\s*/, '').trim();
          const clientHeaderMatch = text.match(/^\*\*([^*:]+):?\*\*/);
          if (clientHeaderMatch) {
            currentClient = clientHeaderMatch[1].trim();
          }
        } else if ((line.startsWith('  -') || line.startsWith('  *') || line.startsWith('\t-') || line.startsWith('\t*') || line.startsWith('-')) && currentClient) {
          const text = line.replace(/^[-*\s\t]+/, '').trim();
          const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            const name = text.split(':')[0].trim();
            const relPath = linkMatch[2].replace(/^\.\//, '').replace(/\\/g, '/');
            files.push({
              name: `${currentClient} - ${name}`,
              category: 'client',
              relativePath: relPath,
              clientName: currentClient
            });
          }
        }
      }
    }

    return {
      title: 'GenieFlow Master Manifest',
      cardinalRules,
      files
    };
  }
}
