// Main JavaScript file for Explorador Web App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Explorador Web App initialized');
    
    // Add some interactive animations
    const features = document.querySelectorAll('.feature');
    
    features.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        feature.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
    
    // Server health check
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            console.log('Server health check:', data);
            if (data.status === 'OK') {
                updateServerStatus('✅ Server is healthy');
            }
        })
        .catch(error => {
            console.error('Health check failed:', error);
            updateServerStatus('❌ Server health check failed');
        });
});

function updateServerStatus(message) {
    const serverInfo = document.querySelector('.server-info');
    if (serverInfo) {
        const statusElement = document.createElement('p');
        statusElement.textContent = message;
        statusElement.style.color = message.includes('✅') ? '#28a745' : '#dc3545';
        statusElement.style.fontWeight = 'bold';
        serverInfo.appendChild(statusElement);
    }
}