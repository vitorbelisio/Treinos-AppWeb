import { markDayAsCompleted } from './dataHandler.js';

let currentWorkoutSession = [];
let currentExerciseIndex = 0;
let currentSeriesCount = 0;
let restTimerInterval;
let currentRestTime = 0;
let defaultRestTime = 90; // Padrão em segundos
let currentDayForExecution = '';

const workoutExecutionView = document.getElementById('workout-execution-view');
const currentExerciseNameElem = document.getElementById('current-exercise-name');
const currentSeriesElem = document.getElementById('current-series');
const currentRepetitionsElem = document.getElementById('current-repetitions');
const exerciseGifElem = document.getElementById('exercise-gif');
const completeSeriesBtn = document.getElementById('complete-series-btn');
const restTimerContainer = document.getElementById('rest-timer-container');
const restTimerElem = document.getElementById('rest-timer');
const prevExerciseBtn = document.getElementById('prev-exercise-btn');
const nextExerciseBtn = document.getElementById('next-exercise-btn');

// Função para exibir mensagens de feedback
const showMessage = (message, type = 'success') => {
    const mainContent = document.querySelector('.content-area');
    let msgElement = document.querySelector('.message');
    if (!msgElement) {
        msgElement = document.createElement('div');
        msgElement.classList.add('message');
        mainContent.prepend(msgElement);
    }
    msgElement.textContent = message;
    msgElement.className = `message ${type}-message`;
    setTimeout(() => {
        msgElement.remove();
    }, 3000);
};

const startWorkoutSession = (workouts, day) => {
    if (workouts.length === 0) {
        showMessage('Nenhum treino adicionado para este dia. Adicione alguns treinos antes de iniciar.', 'error');
        return;
    }
    currentWorkoutSession = workouts;
    currentExerciseIndex = 0;
    currentSeriesCount = 0;
    currentDayForExecution = day;

    // Esconde outras vistas e mostra a de execução
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    workoutExecutionView.classList.remove('hidden');

    displayCurrentExercise();
};

const displayCurrentExercise = () => {
    clearInterval(restTimerInterval);
    restTimerContainer.classList.add('hidden');
    completeSeriesBtn.classList.remove('hidden'); // Garante que o botão "Concluir Série" está visível

    const exercise = currentWorkoutSession[currentExerciseIndex];
    if (!exercise) {
        finishWorkoutSession();
        return;
    }

    currentExerciseNameElem.textContent = exercise.name;
    currentSeriesCount++;
    currentSeriesElem.textContent = `SÉRIE ${currentSeriesCount}`;
    currentRepetitionsElem.textContent = `${exercise.repetitions} REPETIÇÕES`;

    // Atualiza o GIF do exercício (usando placeholders por enquanto)
    const gifName = exercise.name.toLowerCase().replace(/ /g, '_');
    exerciseGifElem.src = `assets/gifs/${gifName}.gif`;
    exerciseGifElem.alt = `GIF do exercício ${exercise.name}`;
    exerciseGifElem.onerror = () => {
        exerciseGifElem.src = 'assets/gifs/placeholder.gif'; // Fallback para GIF genérico
    };

    // Define o tempo de descanso para este exercício ou usa o padrão
    currentRestTime = parseInt(exercise.restTime) || defaultRestTime;

    updateNavigationButtons();
};

const completeSeries = () => {
    const exercise = currentWorkoutSession[currentExerciseIndex];

    if (currentSeriesCount < parseInt(exercise.series)) {
        // Ainda há séries para este exercício, iniciar descanso
        showMessage(`Série ${currentSeriesCount} de ${exercise.series} concluída!`, 'success');
        startRestTimer();
    } else {
        // Última série do exercício, avançar para o próximo exercício
        showMessage(`Exercício "${exercise.name}" concluído!`, 'success');
        currentExerciseIndex++;
        currentSeriesCount = 0; // Resetar para o próximo exercício
        displayCurrentExercise();
    }
};

const startRestTimer = () => {
    completeSeriesBtn.classList.add('hidden'); // Esconde o botão de concluir série durante o descanso
    restTimerContainer.classList.remove('hidden');

    let timeLeft = currentRestTime;
    restTimerElem.textContent = formatTime(timeLeft);

    restTimerInterval = setInterval(() => {
        timeLeft--;
        restTimerElem.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(restTimerInterval);
            showMessage('Descanso concluído! Próximo exercício.', 'success');
            displayCurrentExercise(); // Avança para a próxima série ou próximo exercício
        }
    }, 1000);
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const finishWorkoutSession = () => {
    showMessage('Treino do dia concluído! Parabéns!', 'success');
    markDayAsCompleted(currentDayForExecution, true);
    // Redireciona para a dashboard ou view do dia
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    document.getElementById('dashboard-view').classList.remove('hidden');
    // Força a atualização da UI para mostrar o dia como "Concluído"
    window.dispatchEvent(new Event('workoutCompleted'));
};

const navigateExercise = (direction) => {
    clearInterval(restTimerInterval); // Limpa o timer se estiver ativo
    restTimerContainer.classList.add('hidden');

    const newIndex = currentExerciseIndex + direction;
    if (newIndex >= 0 && newIndex < currentWorkoutSession.length) {
        currentExerciseIndex = newIndex;
        currentSeriesCount = 0; // Reinicia a contagem de séries ao navegar
        displayCurrentExercise();
    } else if (newIndex < 0) {
        showMessage('Você está no primeiro exercício.', 'info');
    } else {
        showMessage('Você está no último exercício. Treino será concluído ao terminar este.', 'info');
    }
};

const updateNavigationButtons = () => {
    prevExerciseBtn.disabled = currentExerciseIndex === 0;
    nextExerciseBtn.disabled = currentExerciseIndex === currentWorkoutSession.length - 1 &&
                                currentSeriesCount === parseInt(currentWorkoutSession[currentExerciseIndex].series);
};

// Event Listeners para a execução do treino
completeSeriesBtn.addEventListener('click', completeSeries);
prevExerciseBtn.addEventListener('click', () => navigateExercise(-1));
nextExerciseBtn.addEventListener('click', () => navigateExercise(1));

// Exporta a função para ser chamada pelo main.js
export { startWorkoutSession };