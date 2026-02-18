class PomodoroForest {
    constructor() {
        this.timeLeft = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.trees = JSON.parse(localStorage.getItem('pomodoroTrees')) || [];
        this.todayTrees = this.getTodayTreeCount();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        this.renderForest();
        this.setInitialTime();
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchPage(e.currentTarget));
        });

        document.getElementById('startBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
        document.getElementById('completeBtn').addEventListener('click', () => this.completeTask());
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());

        document.getElementById('hoursInput').addEventListener('change', () => this.updateTimeFromInputs());
        document.getElementById('minutesInput').addEventListener('change', () => this.updateTimeFromInputs());

        document.getElementById('hoursInput').addEventListener('input', (e) => {
            if (e.target.value > 23) e.target.value = 23;
            if (e.target.value < 0) e.target.value = 0;
        });

        document.getElementById('minutesInput').addEventListener('input', (e) => {
            if (e.target.value > 59) e.target.value = 59;
            if (e.target.value < 1) e.target.value = 1;
        });
    }

    switchPage(navItem) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');

        const page = navItem.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');

        if (page === 'forest') {
            this.renderForest();
        }
    }

    setInitialTime() {
        const hours = parseInt(document.getElementById('hoursInput').value) || 0;
        const minutes = parseInt(document.getElementById('minutesInput').value) || 25;
        this.timeLeft = (hours * 3600) + (minutes * 60);
        this.totalTime = this.timeLeft;
        this.updateDisplay();
    }

    updateTimeFromInputs() {
        if (!this.isRunning) {
            this.setInitialTime();
        }
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timeLeft === 0) {
            this.setInitialTime();
        }

        this.isRunning = true;
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = 'Pause';
        startBtn.classList.add('pulse');
        document.getElementById('completeBtn').style.display = 'inline-block';

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = 'Resume';
        startBtn.classList.remove('pulse');
        clearInterval(this.interval);
    }

    resetTimer() {
        this.pauseTimer();
        this.setInitialTime();
        document.getElementById('startBtn').textContent = 'Start';
        document.getElementById('completeBtn').style.display = 'none';
        document.querySelector('.apple-shape').classList.remove('shake');
    }

    timerComplete() {
        this.pauseTimer();
        document.getElementById('startBtn').textContent = 'Start';
        document.querySelector('.apple-shape').classList.add('shake');
        this.playSound();
        
        setTimeout(() => {
            this.completeTask();
        }, 500);
    }

    completeTask() {
        const taskName = document.getElementById('taskName').value.trim() || 'Focus Session';
        
        const tree = {
            id: Date.now(),
            task: taskName,
            date: new Date().toISOString(),
            duration: this.formatTime(this.totalTime - this.timeLeft)
        };

        this.trees.push(tree);
        localStorage.setItem('pomodoroTrees', JSON.stringify(this.trees));
        
        this.todayTrees = this.getTodayTreeCount();
        this.updateStats();
        this.showCompletionModal();
        
        this.resetTimer();
        document.getElementById('taskName').value = '';
        document.getElementById('completeBtn').style.display = 'none';
    }

    getTodayTreeCount() {
        const today = new Date().toDateString();
        return this.trees.filter(tree => {
            const treeDate = new Date(tree.date).toDateString();
            return treeDate === today;
        }).length;
    }

    updateStats() {
        document.getElementById('todayTrees').textContent = this.todayTrees;
        document.getElementById('totalTrees').textContent = this.trees.length;
        document.getElementById('forestCount').textContent = this.trees.length;
    }

    updateDisplay() {
        const hours = Math.floor(this.timeLeft / 3600);
        const minutes = Math.floor((this.timeLeft % 3600) / 60);
        const seconds = this.timeLeft % 60;

        let timeString;
        if (hours > 0) {
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        document.querySelector('.timer-text').textContent = timeString;

        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 345.58;
        document.querySelector('.progress-circle').style.strokeDashoffset = progress;

        this.updateAppleColor();
    }

    updateAppleColor() {
        const percentage = (this.timeLeft / this.totalTime) * 100;
        const gradient = document.getElementById('appleGradient');
        
        if (percentage > 50) {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#c92a2a;stop-opacity:1" />
            `;
        } else if (percentage > 25) {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#ff8787;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff6b6b;stop-opacity:1" />
            `;
        } else {
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#ffa8a8;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ff8787;stop-opacity:1" />
            `;
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    renderForest() {
        const container = document.getElementById('forestContainer');
        
        if (this.trees.length === 0) {
            container.innerHTML = `
                <div class="empty-forest">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="#e9ecef" opacity="0.5"/>
                        <text x="50" y="60" text-anchor="middle" font-size="40">🌱</text>
                    </svg>
                    <p>Complete tasks to grow your forest!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        this.trees.forEach((tree, index) => {
            const treeElement = this.createTreeElement(tree, index);
            container.appendChild(treeElement);
        });
    }

    createTreeElement(tree, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-item';
        wrapper.style.position = 'relative';
        
        const treeTypes = [
            this.getTreeSVG1(),
            this.getTreeSVG2(),
            this.getTreeSVG3(),
            this.getTreeSVG4()
        ];
        
        const treeType = treeTypes[index % treeTypes.length];
        wrapper.innerHTML = treeType;

        wrapper.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tree-tooltip';
            tooltip.textContent = `${tree.task} - ${tree.duration}`;
            tooltip.style.left = e.pageX + 'px';
            tooltip.style.top = (e.pageY - 40) + 'px';
            tooltip.id = 'tooltip-' + tree.id;
            document.body.appendChild(tooltip);
        });

        wrapper.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip-' + tree.id);
            if (tooltip) tooltip.remove();
        });

        return wrapper;
    }

    getTreeSVG1() {
        return `
            <svg width="60" height="80" viewBox="0 0 60 80">
                <rect x="25" y="50" width="10" height="25" fill="#8b4513"/>
                <circle cx="30" cy="35" r="20" fill="#51cf66"/>
                <circle cx="20" cy="28" r="15" fill="#51cf66"/>
                <circle cx="40" cy="28" r="15" fill="#51cf66"/>
            </svg>
        `;
    }

    getTreeSVG2() {
        return `
            <svg width="60" height="80" viewBox="0 0 60 80">
                <rect x="25" y="55" width="10" height="20" fill="#8b4513"/>
                <polygon points="30,15 10,45 50,45" fill="#37b24d"/>
                <polygon points="30,25 15,50 45,50" fill="#51cf66"/>
                <polygon points="30,35 20,55 40,55" fill="#69db7c"/>
            </svg>
        `;
    }

    getTreeSVG3() {
        return `
            <svg width="60" height="80" viewBox="0 0 60 80">
                <rect x="25" y="50" width="10" height="25" fill="#8b4513"/>
                <ellipse cx="30" cy="35" rx="18" ry="25" fill="#40c057"/>
                <ellipse cx="20" cy="30" rx="12" ry="18" fill="#51cf66"/>
                <ellipse cx="40" cy="30" rx="12" ry="18" fill="#51cf66"/>
            </svg>
        `;
    }

    getTreeSVG4() {
        return `
            <svg width="60" height="80" viewBox="0 0 60 80">
                <rect x="25" y="52" width="10" height="23" fill="#8b4513"/>
                <circle cx="30" cy="38" r="18" fill="#2f9e44"/>
                <circle cx="18" cy="32" r="14" fill="#37b24d"/>
                <circle cx="42" cy="32" r="14" fill="#37b24d"/>
                <circle cx="30" cy="25" r="12" fill="#51cf66"/>
            </svg>
        `;
    }

    showCompletionModal() {
        const modal = document.getElementById('completionModal');
        modal.classList.add('show');
        this.playSound();
    }

    closeModal() {
        const modal = document.getElementById('completionModal');
        modal.classList.remove('show');
    }

    playSound() {
        const sound = document.getElementById('completeSound');
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroForest();
});
