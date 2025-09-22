class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 게임 상태
        this.gameRunning = false;
        this.score = 0;
        this.lives = 1;
        this.gameTime = 0;
        this.startTime = Date.now();
        
        // 이미지 로드
        this.images = {};
        this.loadImages();
        
        // 플레이어 차량
        this.player = {
            x: this.width / 2,
            y: this.height - 100,
            width: 35, // NPC 차량과 동일한 크기로 조정
            height: 55, // NPC 차량과 동일한 크기로 조정
            speed: 8, // 기본 속도 80km/h로 고정
            maxSpeed: 8, // 기본 최대 속도 80km/h
            acceleration: 0, // 자동 가속 비활성화
            deceleration: 0
        };
        
        // AI 차량들
        this.aiCars = [];
        this.aiCarSpeed = 3;
        
        // 도로 설정
        this.roadWidth = 300; // 도로 넓게
        this.roadCenter = this.width / 2;
        this.laneWidth = this.roadWidth / 7; // 7개 차선으로 분할
        this.roadOffset = 0; // 도로가 아래로 내려가는 오프셋
        
        // 부스터 설정
        this.boosterCooldown = 0;
        this.boosterCooldownTime = 8000; // 8초 (밀리초)
        this.boosterDuration = 0;
        this.boosterDurationTime = 5000; // 5초 (밀리초)
        this.isBoosterActive = false;
        this.boosterSpeed = 0; // 부스터 속도 저장
        
        // 장애물
        this.obstacles = [];
        
        // 키 입력 상태
        this.keys = {};
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 게임 시작
        this.init();
    }
    
    loadImages() {
        const imageNames = ['자동차_메인.png', 'NPC 1.png', 'NPC 2.png', 'Map.png'];
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
        this.createAICars();
        this.createObstacles();
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    createAICars() {
        this.aiCars = [];
        const numCars = 7; // 7개 차선에 맞춰 차량 수 조정
        
        // 7개 차선을 정확하게 계산 (중앙 기준으로 좌우 3개씩)
        const lanes = [
            this.roadCenter - this.laneWidth * 3,  // 가장 왼쪽 차선
            this.roadCenter - this.laneWidth * 2,  // 왼쪽에서 2번째
            this.roadCenter - this.laneWidth,      // 왼쪽에서 3번째
            this.roadCenter,                       // 중앙 차선
            this.roadCenter + this.laneWidth,      // 오른쪽에서 3번째
            this.roadCenter + this.laneWidth * 2,  // 오른쪽에서 2번째
            this.roadCenter + this.laneWidth * 3   // 가장 오른쪽 차선
        ];
        
        // 차량 간격을 더 넓게 설정하여 겹치지 않도록 함
        const minGap = 200; // 최소 간격
        
        for (let i = 0; i < numCars; i++) {
            // 각 차선에 하나씩 차량 배치
            const lane = i;
            const x = lanes[lane];
            
            // 각 차량마다 다른 속도 설정 (기본 속도 ± 랜덤)
            const baseSpeed = this.aiCarSpeed;
            const speedVariation = 2; // 속도 변화량
            const individualSpeed = baseSpeed + (Math.random() * speedVariation * 2 - speedVariation);
            
            this.aiCars.push({
                x: x,
                y: -100 - i * minGap, // 차량 간격을 넓게 설정
                width: 35,
                height: 55,
                speed: individualSpeed, // 개별 속도
                lane: lane,
                type: Math.random() < 0.5 ? 'NPC 1.png' : 'NPC 2.png'
            });
        }
    }
    
    createObstacles() {
        // 장애물 제거 - 더 이상 생성하지 않음
        this.obstacles = [];
    }
    
    updatePlayer() {
        // 자동 가속 비활성화 - 기본 속도 80km/h 유지
        
        // 부스터 지속시간 업데이트
        if (this.boosterDuration > 0) {
            this.boosterDuration -= 16; // 약 60fps 기준
            if (this.boosterDuration <= 0) {
                // 부스터 지속시간 종료
                this.isBoosterActive = false;
                this.player.speed = this.boosterSpeed; // 원래 속도로 복원 (80km/h)
                this.boosterCooldown = this.boosterCooldownTime; // 쿨타임 시작
                console.log('부스터 종료! 속도 복원:', this.player.speed); // 디버깅
            }
        }
        
        // 부스터 쿨타임 업데이트
        if (this.boosterCooldown > 0) {
            this.boosterCooldown -= 16; // 약 60fps 기준
        }
        
        // 부스터 (스페이스바) - 쿨타임 확인
        if (this.keys[' '] && this.boosterCooldown <= 0 && this.boosterDuration <= 0) {
            this.isBoosterActive = true;
            this.boosterDuration = this.boosterDurationTime;
            this.boosterSpeed = this.player.speed; // 현재 속도 저장 (80km/h)
            this.player.speed = 15; // 부스터 사용 시 최대 속도 150km/h
            console.log('부스터 활성화! 속도:', this.player.speed, '원래 속도:', this.boosterSpeed); // 디버깅
        }
        
        // 좌우 이동 (차선 기준으로 한칸씩 이동)
        if (this.keys['a'] && this.player.x > this.roadCenter - this.roadWidth/2 + 25) {
            // 왼쪽으로 한칸 이동 (차선 간격만큼)
            this.player.x -= this.laneWidth;
            // 키 입력을 false로 만들어서 연속 이동 방지
            this.keys['a'] = false;
        }
        if (this.keys['d'] && this.player.x < this.roadCenter + this.roadWidth/2 - 25) {
            // 오른쪽으로 한칸 이동 (차선 간격만큼)
            this.player.x += this.laneWidth;
            // 키 입력을 false로 만들어서 연속 이동 방지
            this.keys['d'] = false;
        }
        
        // 경계 제한
        this.player.x = Math.max(this.roadCenter - this.roadWidth/2 + 25, 
                                Math.min(this.roadCenter + this.roadWidth/2 - 25, this.player.x));
        
        // 차선에 정확히 정렬
        this.alignToLane();
    }
    
    alignToLane() {
        // 7개 차선의 정확한 위치 계산
        const lanes = [
            this.roadCenter - this.laneWidth * 3,  // 가장 왼쪽 차선
            this.roadCenter - this.laneWidth * 2,  // 왼쪽에서 2번째
            this.roadCenter - this.laneWidth,      // 왼쪽에서 3번째
            this.roadCenter,                       // 중앙 차선
            this.roadCenter + this.laneWidth,      // 오른쪽에서 3번째
            this.roadCenter + this.laneWidth * 2,  // 오른쪽에서 2번째
            this.roadCenter + this.laneWidth * 3   // 가장 오른쪽 차선
        ];
        
        // 가장 가까운 차선 찾기
        let closestLane = 0;
        let minDistance = Math.abs(this.player.x - lanes[0]);
        
        for (let i = 1; i < lanes.length; i++) {
            const distance = Math.abs(this.player.x - lanes[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestLane = i;
            }
        }
        
        // 가장 가까운 차선에 정확히 정렬
        this.player.x = lanes[closestLane];
    }
    
    updateRoad() {
        // 플레이어 속도에 따라 도로가 아래로 내려감
        if (this.player.speed > 0) {
            this.roadOffset += this.player.speed;
            
            // 도로 오프셋이 너무 커지면 리셋
            if (this.roadOffset > 100) {
                this.roadOffset = 0;
            }
        }
    }
    
    updateAICars() {
        this.aiCars.forEach((car, index) => {
            // 도로가 아래로 내려가므로 AI 차량도 함께 내려감
            car.y += this.player.speed;
            
            // 화면 밖으로 나가면 위로 재배치
            if (car.y > this.height + 100) {
                // 다른 차량들과 겹치지 않는 Y 위치 찾기
                let newY = -100;
                let attempts = 0;
                const maxAttempts = 10;
                
                while (attempts < maxAttempts) {
                    let overlap = false;
                    
                    // 다른 차량들과의 겹침 검사
                    for (let otherCar of this.aiCars) {
                        if (otherCar !== car) {
                            const yDistance = Math.abs(newY - otherCar.y);
                            if (yDistance < 150) { // 최소 간격 150픽셀
                                overlap = true;
                                break;
                            }
                        }
                    }
                    
                    if (!overlap) {
                        break;
                    }
                    
                    newY -= 50; // 겹치면 더 위로 이동
                    attempts++;
                }
                
                car.y = newY;
                
                // 7개 차선 중 랜덤하게 선택
                car.lane = Math.floor(Math.random() * 7);
                
                // 7개 차선에 따른 정확한 X 좌표 설정
                const lanes = [
                    this.roadCenter - this.laneWidth * 3,  // 가장 왼쪽 차선
                    this.roadCenter - this.laneWidth * 2,  // 왼쪽에서 2번째
                    this.roadCenter - this.laneWidth,      // 왼쪽에서 3번째
                    this.roadCenter,                       // 중앙 차선
                    this.roadCenter + this.laneWidth,      // 오른쪽에서 3번째
                    this.roadCenter + this.laneWidth * 2,  // 오른쪽에서 2번째
                    this.roadCenter + this.laneWidth * 3   // 가장 오른쪽 차선
                ];
                
                car.x = lanes[car.lane];
                
                // 개별 속도 재설정 (기본 속도 ± 랜덤)
                const baseSpeed = this.aiCarSpeed;
                const speedVariation = 2;
                car.speed = baseSpeed + (Math.random() * speedVariation * 2 - speedVariation);
                
                car.type = Math.random() < 0.5 ? 'NPC 1.png' : 'NPC 2.png';
            }
            
            // 플레이어와의 충돌 검사
            if (this.checkCollision(this.player, car)) {
                if (this.isBoosterActive) {
                    // 부스터 상태에서는 AI 차량 파괴
                    this.aiCars.splice(index, 1);
                    this.score += 10; // 부스터로 차량 파괴 시 10점
                    
                    // 새로운 차량 생성
                    const lane = Math.floor(Math.random() * 7);
                    
                    // 7개 차선에 따른 정확한 X 좌표 설정
                    const lanes = [
                        this.roadCenter - this.laneWidth * 3,  // 가장 왼쪽 차선
                        this.roadCenter - this.laneWidth * 2,  // 왼쪽에서 2번째
                        this.roadCenter - this.laneWidth,      // 왼쪽에서 3번째
                        this.roadCenter,                       // 중앙 차선
                        this.roadCenter + this.laneWidth,      // 오른쪽에서 3번째
                        this.roadCenter + this.laneWidth * 2,  // 오른쪽에서 2번째
                        this.roadCenter + this.laneWidth * 3   // 가장 오른쪽 차선
                    ];
                    
                    // 다른 차량들과 겹치지 않는 Y 위치 찾기
                    let newY = -100;
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    while (attempts < maxAttempts) {
                        let overlap = false;
                        
                        // 다른 차량들과의 겹침 검사
                        for (let otherCar of this.aiCars) {
                            const yDistance = Math.abs(newY - otherCar.y);
                            if (yDistance < 150) { // 최소 간격 150픽셀
                                overlap = true;
                                break;
                            }
                        }
                        
                        if (!overlap) {
                            break;
                        }
                        
                        newY -= 50; // 겹치면 더 위로 이동
                        attempts++;
                    }
                    
                    // 개별 속도 설정 (기본 속도 ± 랜덤)
                    const baseSpeed = this.aiCarSpeed;
                    const speedVariation = 2;
                    const individualSpeed = baseSpeed + (Math.random() * speedVariation * 2 - speedVariation);
                    
                    this.aiCars.push({
                        x: lanes[lane],
                        y: newY,
                        width: 35,
                        height: 55,
                        speed: individualSpeed, // 개별 속도
                        lane: lane,
                        type: Math.random() < 0.5 ? 'NPC 1.png' : 'NPC 2.png'
                    });
                } else {
                    // 일반 상태에서는 게임 오버
                    this.lives--;
                    this.updateLives();
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        });
    }
    

    
    updateObstacles() {
        // 장애물이 없으므로 업데이트 불필요
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore() {
        // 경과 시간 계산
        const currentTime = Date.now();
        this.gameTime = Math.floor((currentTime - this.startTime) / 1000);
        
        // 거리 기반 점수 (속도 * 시간)
        this.score = Math.floor(this.player.speed * this.gameTime / 2);
        
        document.getElementById('score').textContent = this.score;
        // 속도를 km/h 단위로 표시 (속도 * 10)
        const speedKmh = Math.floor(this.player.speed * 10);
        document.getElementById('speed').textContent = speedKmh;
        
        // 스톱워치 업데이트
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 스톱워치 요소가 있으면 업데이트
        const stopwatchElement = document.getElementById('stopwatch');
        if (stopwatchElement) {
            stopwatchElement.textContent = timeString;
        }
        
        // 부스터 상태 업데이트
        const boosterElement = document.getElementById('booster');
        if (boosterElement) {
            if (this.isBoosterActive) {
                // 부스터 활성 상태
                const durationSeconds = Math.ceil(this.boosterDuration / 1000);
                boosterElement.textContent = `부스터 활성: ${durationSeconds}초`;
                boosterElement.className = 'booster active';
            } else if (this.boosterCooldown > 0) {
                // 부스터 쿨타임 상태
                const cooldownSeconds = Math.ceil(this.boosterCooldown / 1000);
                boosterElement.textContent = `부스터: ${cooldownSeconds}초`;
                boosterElement.className = 'booster cooldown';
            } else {
                // 부스터 준비 상태
                boosterElement.textContent = '부스터: 준비됨';
                boosterElement.className = 'booster ready';
            }
        }
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
        this.lives = 1;
        this.gameTime = 0;
        this.startTime = Date.now();
        this.roadOffset = 0;
        this.player.x = this.width / 2;
        this.player.y = this.height - 100;
        this.player.speed = 8; // 기본 속도 80km/h로 재시작
        this.player.maxSpeed = 8; // 기본 최대 속도 80km/h로 재설정
        this.boosterCooldown = 0; // 부스터 쿨타임 리셋
        this.boosterDuration = 0; // 부스터 지속시간 리셋
        this.isBoosterActive = false;
        this.boosterSpeed = 0; // 부스터 속도 리셋
        this.aiCars = [];
        this.obstacles = [];
        this.createAICars();
        this.createObstacles();
        this.updateScore();
        this.updateLives();
        document.getElementById('gameOver').classList.add('hidden');
        this.gameRunning = true;
        this.gameLoop(); // 게임 루프 다시 시작
    }
    
    drawRoad() {
        // 도로 배경
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(this.roadCenter - this.roadWidth/2, 0, this.roadWidth, this.height);
        
        // 차선 그리기 (움직이는 효과)
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 20]);
        
        // 7개 차선 모두 그리기
        const lanes = [
            this.roadCenter - this.laneWidth * 3,  // 가장 왼쪽 차선
            this.roadCenter - this.laneWidth * 2,  // 왼쪽에서 2번째
            this.roadCenter - this.laneWidth,      // 왼쪽에서 3번째
            this.roadCenter,                       // 중앙 차선
            this.roadCenter + this.laneWidth,      // 오른쪽에서 3번째
            this.roadCenter + this.laneWidth * 2,  // 오른쪽에서 2번째
            this.roadCenter + this.laneWidth * 3   // 가장 오른쪽 차선
        ];
        
        // 각 차선 그리기
        lanes.forEach(laneX => {
            this.ctx.beginPath();
            this.ctx.moveTo(laneX, this.roadOffset);
            this.ctx.lineTo(laneX, this.height + this.roadOffset);
            this.ctx.stroke();
            
            // 추가 차선들 (무한 스크롤 효과)
            this.ctx.beginPath();
            this.ctx.moveTo(laneX, this.roadOffset - 100);
            this.ctx.lineTo(laneX, this.roadOffset);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }
    
    drawPlayer() {
        // PNG 이미지로 플레이어 차량 그리기 (회전 없이)
        if (this.images['자동차_메인.png']) {
            this.ctx.drawImage(
                this.images['자동차_메인.png'],
                this.player.x - this.player.width/2,
                this.player.y - this.player.height/2,
                this.player.width,
                this.player.height
            );
        }
    }
    
    drawAICars() {
        this.aiCars.forEach(car => {
            if (this.images[car.type]) {
                this.ctx.drawImage(
                    this.images[car.type],
                    car.x - car.width/2,
                    car.y - car.height/2,
                    car.width,
                    car.height
                );
            }
        });
    }
    
    drawObstacles() {
        // 장애물이 없으므로 그리기 불필요
    }
    
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 도로 그리기
        this.drawRoad();
        
        // AI 차량 그리기
        this.drawAICars();
        
        // 장애물 그리기
        this.drawObstacles();
        
        // 플레이어 차량 그리기
        this.drawPlayer();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updatePlayer();
        this.updateRoad();
        this.updateAICars();
        this.updateObstacles();
        this.updateScore();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new RacingGame();
});
