class GalagaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 게임 상태
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        
        // 이미지 로드
        this.images = {};
        this.loadImages();
        
        // 플레이어 설정
        this.player = {
            x: this.width / 2,
            y: this.height - 80,
            width: 40,
            height: 40,
            speed: 5,
            health: 3
        };
        
        // 총알 배열
        this.bullets = [];
        this.bulletSpeed = 7;
        
        // 적 총알 배열
        this.enemyBullets = [];
        this.enemyBulletSpeed = 3;
        
        // 적 배열
        this.enemies = [];
        this.enemyTypes = ['적1.png', '적2.png', '적3.png'];
        this.enemySpeed = 0.5; // 속도 감소
        this.enemyDirection = 1;
        
        // 키 입력 상태
        this.keys = {};
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 게임 시작
        this.init();
    }
    
    loadImages() {
        const imageNames = ['전투기.png', '적1.png', '적2.png', '적3.png'];
        let loadedImages = 0;
        
        imageNames.forEach(name => {
            const img = new Image();
            img.onload = () => {
                loadedImages++;
                if (loadedImages === imageNames.length) {
                    this.startGame();
                }
            };
            img.src = `${name}`;
            this.images[name] = img;
        });
    }
    
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // 스페이스바로 총알 발사
            if (e.key === ' ' && this.gameRunning) {
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 다시 시작 버튼
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    init() {
        this.createEnemies();
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = 4;
        const cols = 8;
        const enemyWidth = 40;
        const enemyHeight = 40;
        const startX = 100;
        const startY = 50;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemyType = this.enemyTypes[row % this.enemyTypes.length];
                this.enemies.push({
                    x: startX + col * (enemyWidth + 20),
                    y: startY + row * (enemyHeight + 20),
                    width: enemyWidth,
                    height: enemyHeight,
                    type: enemyType,
                    health: 2,
                    direction: 1,
                    canShoot: Math.random() < 0.3, // 30% 확률로 총알 발사 가능
                    lastShot: 0,
                    shotCooldown: Math.random() * 2000 + 1000 // 1-3초 간격으로 발사
                });
            }
        }
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: this.bulletSpeed
        });
    }
    
    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            speed: this.enemyBulletSpeed
        });
    }
    
    updatePlayer() {
        // AD만으로 좌우 이동 (WS 제거)
        if (this.keys['a'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['d'] && this.player.x < this.width - this.player.width) {
            this.player.x += this.player.speed;
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            // 화면 밖으로 나간 총알 제거
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 적과의 충돌 검사
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(bullet, enemy)) {
                    enemy.health--;
                    this.bullets.splice(i, 1);
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += 100;
                        this.updateScore();
                    }
                    break;
                }
            }
        }
        
        // 적 총알 업데이트
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            // 화면 밖으로 나간 총알 제거
            if (bullet.y > this.height) {
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // 플레이어와의 충돌 검사
            if (this.checkCollision(bullet, this.player)) {
                this.enemyBullets.splice(i, 1);
                this.gameOver();
                break;
            }
        }
    }
    
    updateEnemies() {
        const currentTime = Date.now();
        let shouldChangeDirection = false;
        
        // 적들의 이동
        this.enemies.forEach(enemy => {
            // 다음 위치 계산
            const nextX = enemy.x + this.enemySpeed * enemy.direction;
            
            // 경계 확인 - 벽에 닿으면 방향 전환
            if (nextX <= 0 || nextX + enemy.width >= this.width) {
                shouldChangeDirection = true;
                // 벽에 닿지 않도록 위치 조정
                if (nextX <= 0) {
                    enemy.x = 0;
                } else {
                    enemy.x = this.width - enemy.width;
                }
            } else {
                enemy.x = nextX;
            }
            
            // 적 총알 발사
            if (enemy.canShoot && currentTime - enemy.lastShot > enemy.shotCooldown) {
                this.enemyShoot(enemy);
                enemy.lastShot = currentTime;
            }
            
            // 플레이어와의 충돌 검사
            if (this.checkCollision(enemy, this.player)) {
                this.gameOver();
            }
        });
        
        // 방향 변경 및 아래로 이동 (한 칸씩)
        if (shouldChangeDirection) {
            this.enemies.forEach(enemy => {
                enemy.direction *= -1;
                enemy.y += 60; // 한 칸 크기만큼 내려가기 (40px 적 크기 + 20px 간격)
            });
        }
        
        // 모든 적이 파괴되면 새로운 적 생성
        if (this.enemies.length === 0) {
            this.createEnemies();
            this.enemySpeed += 0.2; // 난이도 증가 (속도 감소)
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.enemySpeed = 0.5; // 재시작 시에도 느린 속도로 시작
        
        // 플레이어 위치 초기화
        this.player.x = this.width / 2;
        this.player.y = this.height - 80;
        
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.createEnemies();
        this.updateScore();
        this.updateLives();
        document.getElementById('gameOver').classList.add('hidden');
        this.gameRunning = true;
        this.gameLoop(); // 게임 루프 다시 시작
    }
    
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 플레이어 그리기
        if (this.images['전투기.png']) {
            this.ctx.drawImage(
                this.images['전투기.png'],
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        }
        
        // 총알 그리기
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // 적 총알 그리기
        this.ctx.fillStyle = '#ff0000';
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // 적 그리기
        this.enemies.forEach(enemy => {
            if (this.images[enemy.type]) {
                this.ctx.drawImage(
                    this.images[enemy.type],
                    enemy.x,
                    enemy.y,
                    enemy.width,
                    enemy.height
                );
            }
            
            // 체력 표시
            if (enemy.health < 2) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new GalagaGame();
});
