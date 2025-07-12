import {
    initializeData,
    loadData,
    getWorkoutsForDay,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    isDayCompleted
} from './dataHandler.js';
import { startWorkoutSession } from './workoutRunner.js';

// Elementos do DOM
const dayTabsContainer = document.getElementById('day-tabs');
const dashboardView = document.getElementById('dashboard-view');
const workoutDayView = document.getElementById('workout-day-view');
const currentDayTitle = document.getElementById('current-day-title');
const currentDayWorkoutsList = document.getElementById('current-day-workouts');
const addWorkoutBtn = document.getElementById('add-workout-btn');
const startWorkoutSessionBtn = document.getElementById('start-workout-session-btn');
const addEditWorkoutFormContainer = document.getElementById('add-edit-workout-form');
const workoutForm = document.getElementById('workout-form');
const workoutIdInput = document.getElementById('workout-id');
const exerciseNameInput = document.getElementById('exercise-name');
const muscleTypeSelect = document.getElementById('muscle-type');
const customMuscleTypeInput = document.getElementById('custom-muscle-type');
const numSeriesInput = document.getElementById('num-series');
const repetitionsInput = document.getElementById('repetitions');
const restTimeInput = document.getElementById('rest-time');
const cancelAddEditBtn = document.getElementById('cancel-add-edit');

let currentActiveDay = ''; // Armazena o dia da semana ativo

// Dias da semana
const daysOfWeek = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// --- Funções de UI e Navegação ---

// Exibe uma mensagem para o usuário
const showMessage = (message, type = 'success') => {
    let msgElement = document.querySelector('.message');
    if (!msgElement) {
        msgElement = document.createElement('div');
        msgElement.classList.add('message');
        document.querySelector('.content-area').prepend(msgElement);
    }
    msgElement.textContent = message;
    msgElement.className = `message ${type}-message`;
    setTimeout(() => {
        msgElement.remove();
    }, 3000);
};

// Alterna a exibição das seções
const showView = (viewId) => {
    document.querySelectorAll('section').forEach(section => section.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
};

// Gera as abas dos dias da semana
const renderDayTabs = () => {
    dayTabsContainer.innerHTML = '';
    daysOfWeek.forEach(day => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = day;
        button.dataset.day = day;
        if (isDayCompleted(day)) {
            button.classList.add('completed');
        }
        button.addEventListener('click', () => selectDay(day));
        li.appendChild(button);
        dayTabsContainer.appendChild(li);
    });
};

// Seleciona um dia da semana
const selectDay = (day) => {
    currentActiveDay = day;
    showView('workout-day-view');
    currentDayTitle.textContent = `Treinos de ${day}`;

    // Atualiza a classe 'active' nas abas
    document.querySelectorAll('.day-tabs button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.day === day) {
            btn.classList.add('active');
        }
    });

    renderWorkoutsForDay(day);
    addEditWorkoutFormContainer.classList.add('hidden'); // Esconde o formulário ao trocar de dia
};

// Renderiza a lista de treinos para o dia selecionado
const renderWorkoutsForDay = (day) => {
    const workouts = getWorkoutsForDay(day);
    currentDayWorkoutsList.innerHTML = '';

    if (workouts.length === 0) {
        currentDayWorkoutsList.innerHTML = '<p>Nenhum treino adicionado para este dia ainda.</p>';
        startWorkoutSessionBtn.disabled = true; // Desabilita botão de iniciar treino se não houver treinos
    } else {
        startWorkoutSessionBtn.disabled = false;
        workouts.forEach(workout => {
            const li = document.createElement('li');
            li.dataset.id = workout.id;
            li.innerHTML = `
                <div class="workout-info">
                    <h4>${workout.name}</h4>
                    <p><strong>Tipo:</strong> ${workout.muscleType}</p>
                    <p><strong>Séries:</strong> ${workout.series} | <strong>Repetições:</strong> ${workout.repetitions}</p>
                    <p><strong>Descanso:</strong> ${workout.restTime}s</p>
                </div>
                <div class="workout-actions">
                    <button class="edit-btn" data-id="${workout.id}">Editar</button>
                    <button class="delete-btn" data-id="${workout.id}">Remover</button>
                </div>
            `;
            currentDayWorkoutsList.appendChild(li);
        });
    }
};

// --- Funções de Gestão de Treinos ---

// Abre o formulário para adicionar/editar treino
const openWorkoutForm = (workout = null) => {
    addEditWorkoutFormContainer.classList.remove('hidden');
    workoutForm.reset(); // Limpa o formulário

    // Esconde o campo de customização inicialmente
    customMuscleTypeInput.classList.add('hidden');

    if (workout) {
        // Modo de Edição
        workoutIdInput.value = workout.id;
        exerciseNameInput.value = workout.name;
        muscleTypeSelect.value = workout.muscleType;
        if (![...muscleTypeSelect.options].map(o => o.value).includes(workout.muscleType)) {
            // Se o tipo de músculo for personalizado, selecione "Outro" e mostre o campo
            muscleTypeSelect.value = 'Outro';
            customMuscleTypeInput.value = workout.muscleType;
            customMuscleTypeInput.classList.remove('hidden');
        }
        numSeriesInput.value = workout.series;
        repetitionsInput.value = workout.repetitions;
        restTimeInput.value = workout.restTime;
    } else {
        // Modo de Adição
        workoutIdInput.value = ''; // Limpa o ID para nova adição
    }
};

// Fecha o formulário
const closeWorkoutForm = () => {
    addEditWorkoutFormContainer.classList.add('hidden');
};

// Valida os dados do formulário
const validateWorkoutForm = (workoutData) => {
    if (!workoutData.name.trim()) {
        showMessage('O nome do exercício é obrigatório.', 'error');
        return false;
    }
    if (!workoutData.muscleType.trim()) {
        showMessage('O tipo de músculo é obrigatório.', 'error');
        return false;
    }
    if (isNaN(workoutData.series) || parseInt(workoutData.series) <= 0) {
        showMessage('Número de séries deve ser um valor numérico positivo.', 'error');
        return false;
    }
    if (!workoutData.repetitions.trim()) {
        showMessage('Repetições por série é obrigatório.', 'error');
        return false;
    }
    if (isNaN(workoutData.restTime) || parseInt(workoutData.restTime) < 0) {
        showMessage('Tempo de descanso deve ser um valor numérico positivo (ou zero).', 'error');
        return false;
    }
    return true;
};

// Salva (adiciona ou edita) um treino
const saveWorkout = (event) => {
    event.preventDefault();

    const workoutId = workoutIdInput.value;
    let selectedMuscleType = muscleTypeSelect.value;

    // Se "Outro" foi selecionado, use o valor do campo de texto livre
    if (selectedMuscleType === 'Outro') {
        selectedMuscleType = customMuscleTypeInput.value.trim();
    }

    const workoutData = {
        name: exerciseNameInput.value.trim(),
        muscleType: selectedMuscleType,
        series: parseInt(numSeriesInput.value),
        repetitions: repetitionsInput.value.trim(),
        restTime: parseInt(restTimeInput.value) || 90 // Padrão 90s se não especificado
    };

    if (!validateWorkoutForm(workoutData)) {
        return;
    }

    if (workoutId) {
        // Edição
        updateWorkout(currentActiveDay, workoutId, workoutData);
        showMessage('Treino atualizado com sucesso!', 'success');
    } else {
        // Adição
        addWorkout(currentActiveDay, workoutData);
        showMessage('Treino adicionado com sucesso!', 'success');
    }

    closeWorkoutForm();
    renderWorkoutsForDay(currentActiveDay); // Atualiza a lista
};

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    initializeData(); // Garante que a estrutura de dados esteja pronta
    renderDayTabs(); // Renderiza as abas inicialmente
    showView('dashboard-view'); // Começa na dashboard
});

// Listener para o botão "Adicionar Novo Treino"
addWorkoutBtn.addEventListener('click', () => openWorkoutForm());

// Listener para o botão "Cancelar" no formulário
cancelAddEditBtn.addEventListener('click', closeWorkoutForm);

// Listener para o envio do formulário de treino
workoutForm.addEventListener('submit', saveWorkout);

// Listener de delegação para botões de Editar/Remover na lista de treinos
currentDayWorkoutsList.addEventListener('click', (event) => {
    const target = event.target;
    const workoutId = target.dataset.id;

    if (target.classList.contains('edit-btn')) {
        const workouts = getWorkoutsForDay(currentActiveDay);
        const workoutToEdit = workouts.find(w => w.id === workoutId);
        if (workoutToEdit) {
            openWorkoutForm(workoutToEdit);
        }
    } else if (target.classList.contains('delete-btn')) {
        if (confirm('Tem certeza que deseja remover este treino?')) {
            deleteWorkout(currentActiveDay, workoutId);
            showMessage('Treino removido com sucesso!', 'success');
            renderWorkoutsForDay(currentActiveDay);
        }
    }
});

// Listener para o botão "Iniciar Treino"
startWorkoutSessionBtn.addEventListener('click', () => {
    const workouts = getWorkoutsForDay(currentActiveDay);
    startWorkoutSession(workouts, currentActiveDay);
});

// Listener para a mudança no select de tipo de músculo
muscleTypeSelect.addEventListener('change', () => {
    if (muscleTypeSelect.value === 'Outro') {
        customMuscleTypeInput.classList.remove('hidden');
        customMuscleTypeInput.setAttribute('required', 'required'); // Torna obrigatório
    } else {
        customMuscleTypeInput.classList.add('hidden');
        customMuscleTypeInput.removeAttribute('required');
        customMuscleTypeInput.value = ''; // Limpa o valor
    }
});

// Evento customizado para quando o treino for concluído no workoutRunner
window.addEventListener('workoutCompleted', () => {
    renderDayTabs(); // Re-renderiza as abas para atualizar o status de "Concluído"
    selectDay(currentActiveDay); // Volta para a visualização do dia e garante que a lista está atualizada
});

// Opcional: Selecionar o dia atual ao carregar (se houver)
const todayIndex = new Date().getDay() - 1; // 0=Dom, 1=Seg...
if (todayIndex >= 0 && todayIndex < daysOfWeek.length) {
    selectDay(daysOfWeek[todayIndex]);
} else {
    // Se for domingo ou fora do range, foca na dashboard
    showView('dashboard-view');
}