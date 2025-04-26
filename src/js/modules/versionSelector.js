// Format date to DD/MM/YYYY
function formatDate(dateStr) {
    console.log('Formatting date:', dateStr);
    const datePart = dateStr.split('T')[0];
    console.log('Date part:', datePart);
    const [year, month, day] = datePart.split('-');
    console.log('Parsed:', { year, month, day });
    return `${day}/${month}/${year}`;
}

// Initialize version selector
export async function initVersionSelector(onVersionSelect) {
    try {
        const selector = document.getElementById('version-selector');
        const mobileSelector = document.getElementById('mobile-version-selector');
        
        if (!selector && !mobileSelector) {
            throw new Error('Version selector elements not found');
        }

        const response = await fetch('/versions.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch versions: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Versions data:', data);
        const versions = data.versions;
        const metadata = data.metadata || {};
        
        if (!versions || !Array.isArray(versions) || versions.length === 0) {
            throw new Error('No versions available');
        }
        
        // Sort versions with 'latest' at the top
        versions.sort((a, b) => {
            if (a === 'latest') return -1;
            if (b === 'latest') return 1;
            return b.localeCompare(a); // Reverse chronological order
        });
        
        // Update selector options
        const optionsHtml = versions.map(v => {
            const meta = metadata[v] || {};
            console.log(`Version ${v} metadata:`, meta);
            const date = meta.currentWithMainAs ? 
                ` (main as of ${formatDate(meta.currentWithMainAs)})` : '';
            return `<option value="${v}"${v === 'latest' ? ' selected' : ''}>
                ${v === 'latest' ? 'Latest' : v}${date}
            </option>`;
        }).join('');

        // Update both selectors if they exist
        if (selector) selector.innerHTML = optionsHtml;
        if (mobileSelector) mobileSelector.innerHTML = optionsHtml;
        
        // Add change handler to desktop selector
        if (selector) {
            selector.addEventListener('change', async () => {
                const version = selector.value;
            
                // Show loading state
                const loading = document.getElementById('loading');
                const viewer = document.getElementById('viewer');
                const fileTree = document.getElementById('file-tree');
                
                if (!loading || !viewer || !fileTree) {
                    throw new Error('Required DOM elements not found');
                }
                
                loading.style.display = 'flex';
                viewer.style.display = 'none';
                fileTree.innerHTML = '';
                
                try {
                    // Load new version
                    await onVersionSelect(version);
                    
                    // Update URL with version
                    const params = new URLSearchParams(window.location.search);
                    params.set('version', version);
                    window.history.replaceState({}, '', '?' + params.toString());
                    
                    // Update mobile selector if it exists
                    if (mobileSelector) {
                        mobileSelector.value = version;
                    }
                } catch (error) {
                    console.error('Failed to load version:', error);
                    loading.innerHTML = `
                        <div class="error-message">
                            <h1 style="color: var(--accent-color)">Error: Failed to load version ${version}</h1>
                            <p style="color: var(--terminal-output); margin-top: 1rem;">${error.message}</p>
                        </div>
                    `;
                }
            });
        }

        return versions[0] || 'latest';
    } catch (error) {
        console.error('Failed to initialize version selector:', error);
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div class="error-message">
                    <h1 style="color: var(--accent-color)">Error: Failed to initialize</h1>
                    <p style="color: var(--terminal-output); margin-top: 1rem;">${error.message}</p>
                </div>
            `;
        }
        throw error;
    }
}

// Update version info display
export async function updateVersionInfo(version, fileCount) {
    const versionInfo = document.createElement('div');
    versionInfo.className = 'version-info';
    
    try {
        const response = await fetch('/versions.json');
        const data = await response.json();
        const metadata = data.metadata || {};
        const meta = metadata[version] || {};
        console.log(`Version info ${version} metadata:`, meta);
        const date = meta.currentWithMainAs ? 
            ` | main as of ${formatDate(meta.currentWithMainAs)}` : '';
        const status = meta.status ? ` | ${meta.status}` : '';
        
        versionInfo.textContent = `Version ${version === 'latest' ? 'Latest' : version} - ${fileCount} files${date}${status}`;
    } catch (error) {
        console.error('Failed to fetch version metadata:', error);
        versionInfo.textContent = `Version ${version === 'latest' ? 'Latest' : version} - ${fileCount} files`;
    }
    
    const fileTree = document.getElementById('file-tree');
    if (fileTree) {
        // Remove existing version info if any
        const existingInfo = fileTree.querySelector('.version-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Add new version info at the top
        fileTree.insertBefore(versionInfo, fileTree.firstChild);
    }
}
