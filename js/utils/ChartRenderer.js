/**
 * Chart renderer utility for creating statistical visualizations
 * Uses Canvas API to draw charts for user statistics
 */
class ChartRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Set high DPI for crisp rendering
        this.setupHighDPI();
    }

    /**
     * Setup high DPI rendering for crisp charts
     */
    setupHighDPI() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw a pie chart for genre distribution
     */
    drawPieChart(data, options = {}) {
        const {
            centerX = this.width / 2,
            centerY = this.height / 2,
            radius = Math.min(this.width, this.height) / 3,
            colors = ['#3B82F6', '#FBBF24', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4', '#F59E0B', '#84CC16'],
            showLabels = true,
            showPercentages = true
        } = options;

        this.clear();

        // Calculate total and angles
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2; // Start at top

        // Draw pie slices
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = colors[index % colors.length];

            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // Draw labels if enabled
            if (showLabels && item.value > 0) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
                const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

                this.ctx.fillStyle = '#0F172A';
                this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = labelX > centerX ? 'left' : 'right';
                this.ctx.textBaseline = 'middle';

                const percentage = ((item.value / total) * 100).toFixed(1);
                const label = showPercentages ? `${item.label} ${percentage}%` : item.label;
                this.ctx.fillText(label, labelX, labelY);
            }

            currentAngle += sliceAngle;
        });

        // Draw legend
        this.drawLegend(data, colors, {
            x: 10,
            y: this.height - (data.length * 20 + 10),
            itemHeight: 20
        });
    }

    /**
     * Draw a horizontal bar chart
     */
    drawHorizontalBarChart(data, options = {}) {
        const {
            padding = 40,
            barHeight = 25,
            spacing = 10,
            colors = ['#3B82F6', '#10B981', '#FBBF24', '#EF4444', '#8B5CF6'],
            showValues = true
        } = options;

        this.clear();

        const maxValue = Math.max(...data.map(item => item.value));
        const chartWidth = this.width - padding * 2;
        const chartHeight = data.length * (barHeight + spacing) - spacing;
        const startY = (this.height - chartHeight) / 2;

        data.forEach((item, index) => {
            const y = startY + index * (barHeight + spacing);
            const barWidth = (item.value / maxValue) * chartWidth;
            const color = colors[index % colors.length];

            // Draw bar
            this.ctx.fillStyle = color;
            this.ctx.fillRect(padding, y, barWidth, barHeight);

            // Draw label
            this.ctx.fillStyle = '#0F172A';
            this.ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.label, 10, y + barHeight / 2);

            // Draw value if enabled
            if (showValues) {
                this.ctx.textAlign = 'right';
                this.ctx.fillText(item.value.toString(), this.width - 10, y + barHeight / 2);
            }
        });
    }

    /**
     * Draw a donut chart with center text
     */
    drawDonutChart(data, options = {}) {
        const {
            centerX = this.width / 2,
            centerY = this.height / 2,
            outerRadius = Math.min(this.width, this.height) / 3,
            innerRadius = outerRadius * 0.6,
            colors = ['#3B82F6', '#FBBF24', '#8B5CF6'],
            centerText = '',
            centerSubtext = ''
        } = options;

        this.clear();

        // Calculate total and angles
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;

        // Draw donut slices
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = colors[index % colors.length];

            // Draw slice
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            this.ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();

            currentAngle += sliceAngle;
        });

        // Draw center text
        if (centerText) {
            this.ctx.fillStyle = '#0F172A';
            this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(centerText, centerX, centerY - 10);
        }

        if (centerSubtext) {
            this.ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.fillStyle = '#64748B';
            this.ctx.fillText(centerSubtext, centerX, centerY + 15);
        }

        // Draw legend
        this.drawLegend(data, colors, {
            x: 10,
            y: 10,
            itemHeight: 20,
            horizontal: true
        });
    }

    /**
     * Draw a line chart for time series data
     */
    drawLineChart(data, options = {}) {
        const {
            padding = 40,
            lineColor = '#3B82F6',
            lineWidth = 3,
            showPoints = true,
            pointRadius = 4,
            showGrid = true,
            gridColor = '#E2E8F0'
        } = options;

        this.clear();

        if (data.length === 0) return;

        const chartWidth = this.width - padding * 2;
        const chartHeight = this.height - padding * 2;

        const minY = Math.min(...data.map(item => item.value));
        const maxY = Math.max(...data.map(item => item.value));
        const rangeY = maxY - minY || 1;

        // Draw grid if enabled
        if (showGrid) {
            this.ctx.strokeStyle = gridColor;
            this.ctx.lineWidth = 1;
            
            // Horizontal grid lines
            for (let i = 0; i <= 5; i++) {
                const y = padding + (chartHeight / 5) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(padding, y);
                this.ctx.lineTo(this.width - padding, y);
                this.ctx.stroke();
            }

            // Vertical grid lines
            const stepX = chartWidth / (data.length - 1);
            for (let i = 0; i < data.length; i++) {
                const x = padding + stepX * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, padding);
                this.ctx.lineTo(x, this.height - padding);
                this.ctx.stroke();
            }
        }

        // Draw line
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        data.forEach((item, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = this.height - padding - ((item.value - minY) / rangeY) * chartHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();

        // Draw points if enabled
        if (showPoints) {
            this.ctx.fillStyle = lineColor;
            data.forEach((item, index) => {
                const x = padding + (chartWidth / (data.length - 1)) * index;
                const y = this.height - padding - ((item.value - minY) / rangeY) * chartHeight;

                this.ctx.beginPath();
                this.ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        }

        // Draw labels
        this.ctx.fillStyle = '#64748B';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        data.forEach((item, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            this.ctx.fillText(item.label, x, this.height - padding + 10);
        });
    }

    /**
     * Draw legend for charts
     */
    drawLegend(data, colors, options = {}) {
        const {
            x = 10,
            y = 10,
            itemHeight = 20,
            itemWidth = 150,
            horizontal = false
        } = options;

        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.textBaseline = 'middle';

        data.forEach((item, index) => {
            const color = colors[index % colors.length];
            const itemX = horizontal ? x + (index * itemWidth) : x;
            const itemY = horizontal ? y : y + (index * itemHeight);

            // Draw color box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(itemX, itemY, 12, 12);

            // Draw label
            this.ctx.fillStyle = '#0F172A';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, itemX + 18, itemY + 6);
        });
    }

    /**
     * Create a responsive chart that redraws on window resize
     */
    static createResponsiveChart(canvasId, chartType, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const renderer = new ChartRenderer(canvas);
        
        const drawChart = () => {
            renderer.setupHighDPI();
            
            switch (chartType) {
                case 'pie':
                    renderer.drawPieChart(data, options);
                    break;
                case 'donut':
                    renderer.drawDonutChart(data, options);
                    break;
                case 'horizontalBar':
                    renderer.drawHorizontalBarChart(data, options);
                    break;
                case 'line':
                    renderer.drawLineChart(data, options);
                    break;
                default:
                    console.warn('Unknown chart type:', chartType);
            }
        };

        // Initial draw
        drawChart();

        // Redraw on window resize
        const handleResize = () => {
            setTimeout(drawChart, 100);
        };
        window.addEventListener('resize', handleResize);

        return {
            renderer,
            redraw: drawChart,
            destroy: () => window.removeEventListener('resize', handleResize)
        };
    }
}
