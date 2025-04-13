document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide();

    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadlineDate = document.getElementById('deadline-date');
    const deadlineTime = document.getElementById('deadline-time');
    const photoInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const taskList = document.getElementById('taskList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const charsRemaining = document.getElementById('charsRemaining');

    // Установка минимальной даты (сегодня)
    const today = new Date().toISOString().split('T')[0];
    deadlineDate.setAttribute('min', today);
    deadlineDate.value = today;

    // Ограничение символов в описании задачи
    taskText.addEventListener('input', function() {
        const maxLength = 1000;
        const remaining = maxLength - this.value.length;
        charsRemaining.textContent = remaining;
        
        if (remaining < 50) {
            charsRemaining.style.color = '#ff6b6b';
        } else {
            charsRemaining.style.color = '#666';
        }
    });

    // Обработка фото (до 10 штук)
    photoInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 10);
        
        if (files.length > 0) {
            files.forEach(file => {
                if (!file.type.match('image.*')) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });

    // Отправка формы
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!taskText.value.trim()) {
            tg.showAlert("Пожалуйста, опишите задачу");
            return;
        }

        tg.HapticFeedback.impactOccurred('light');

        // Собираем дату и время
        const deadline = `${deadlineDate.value}T${deadlineTime.value}:00`;
        
        const formData = new FormData(taskForm);
        const taskData = {
            action: 'create_task',
            text: formData.get('taskText'),
            deadline: deadline,
            photos: Array.from(formData.getAll('photos'))
        };

        tg.sendData(JSON.stringify(taskData));
        tg.close();
    });

    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tasks') {
                loadUserTasks();
            }
        });
    });

    // Загрузка задач с выпадающими решениями
    async function loadUserTasks() {
        const exampleTasks = [
            {
                id: 1,
                text: "Подготовить презентацию для клиента",
                deadline: "2023-12-15T18:00",
                status: "completed",
                solution: "Презентация включает 15 слайдов с анализом рынка и нашими предложениями. Все графики актуализированы.",
                photos: []
            },
            {
                id: 2,
                text: "Написать техническое задание",
                deadline: "2023-12-10T12:00",
                status: "created",
                solution: "",
                photos: []
            },
            {
                id: 3,
                text: "Разработать логотип для нового продукта",
                deadline: "2023-12-20T15:00",
                status: "clarification",
                question: "Какие цвета должны преобладать в логотипе и есть ли у вас примеры, которые вам нравятся?",
                photos: []
            }
        ];

        taskList.innerHTML = '';
        exampleTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            
            let statusText = '';
            let statusClass = '';
            
            switch(task.status) {
                case 'completed':
                    statusText = 'Завершена';
                    statusClass = 'status-completed';
                    break;
                case 'created':
                    statusText = 'Создана';
                    statusClass = 'status-in-progress';
                    break;
                case 'clarification':
                    statusText = 'Уточнение';
                    statusClass = 'status-clarification';
                    break;
            }
            
            taskCard.innerHTML = `
                <div class="task-id">Задача #${task.id}</div>
                <div class="task-text">${task.text}</div>
                <div class="task-deadline">⏰ ${new Date(task.deadline).toLocaleString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                <div class="task-status ${statusClass}">
                    ${statusText}
                </div>
                
                ${task.status === 'completed' && task.solution ? `
                <div class="solution-dropdown">
                    <button class="solution-toggle">
                        Показать решение
                        <svg class="dropdown-icon" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#388e3c" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <div class="solution-content">
                        <p>${task.solution}</p>
                    </div>
                </div>` : ''}
                
                ${task.status === 'clarification' ? `
                <div class="clarification-question">
                    <strong>Вопрос оператора:</strong> ${task.question}
                </div>
                <textarea class="clarification-input" placeholder="Введите ваш ответ..." maxlength="500"></textarea>
                <div class="clarification-counter"><span class="clarification-remaining">500</span>/500 символов</div>
                ` : ''}
            `;
            taskList.appendChild(taskCard);
        });

        setupSolutionDropdowns();
        setupClarificationInputs();
    }

    // Инициализация выпадающих решений
    function setupSolutionDropdowns() {
        document.querySelectorAll('.solution-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const solutionContent = this.nextElementSibling;
                const icon = this.querySelector('.dropdown-icon');
                
                solutionContent.classList.toggle('show');
                icon.classList.toggle('rotated');
                
                if (solutionContent.classList.contains('show')) {
                    solutionContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }

    // Инициализация полей для уточнения
    function setupClarificationInputs() {
        document.querySelectorAll('.clarification-input').forEach(input => {
            const counter = input.parentElement.querySelector('.clarification-remaining');
            
            input.addEventListener('input', function() {
                const remaining = 500 - this.value.length;
                counter.textContent = remaining;
                
                if (remaining < 50) {
                    counter.style.color = '#ff6b6b';
                } else {
                    counter.style.color = '#666';
                }
            });
        });
    }

    // Первоначальная загрузка
    if (tg.initDataUnsafe.user) {
        console.log(`Пользователь: ${tg.initDataUnsafe.user.first_name}`);
    }
});
