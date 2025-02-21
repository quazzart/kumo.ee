(function () {
    const elements = {
        timer: {
            display: () => document.getElementById('timer'),
            elapsed: () => document.getElementById('elapsed'),
        },
        buttons: {
            start: () => document.getElementById('startButton'),
            pause: () => document.getElementById('pauseButton'),
            stop: () => document.getElementById('stopButton'),
            clearHistory: () => document.getElementById('clear-history'),
        },
        inputs: {
            minutes: () => document.getElementById('minutesInput'),
            seconds: () => document.getElementById('secondsInput'),
            label: () => document.getElementById('labelInput'),
        },
        history: {
            entries: () => document.getElementById('history-entries'),
        }
    }

    const components = {
        historyEntry: (remaining, elapsed, timestamp, label) => {
            const historyEntry = document.createElement('div')
            historyEntry.className = 'history-entry'
            historyEntry.innerHTML = `
            <div>
                <strong>${new Date(timestamp).toLocaleString()}</strong> ${label ? `(${label})` : ''}<br>
                Time Left: ${formatTime(remaining)}<br>
                Elapsed: ${formatTime(elapsed)}
            </div>
            <div class="remove-history-entry">❌</div>`

            return historyEntry
        }
    }

    const storage = {
        load(key, defaultValue = null) {
            const item = localStorage.getItem(key)
            if (item === null) {
                return defaultValue
            }
            return JSON.parse(item)
        },
        save(key, value) {
            localStorage.setItem(key, JSON.stringify(value))
        },
        update(key, callback, defaultValue = null) {
            const value = callback(this.load(key, defaultValue))
            this.save(key, value)
        }
    }

    const history = {
        default: { lastId: 0, entries: [] },
        add(remaining, elapsed, timestamp, label = '') {
            let lastId = 0
            storage.update('history', history => {
                history.lastId++
                history.entries.push({ remaining, elapsed, timestamp, label, id: history.lastId })
                lastId = history.lastId
                return history
            }, this.default)
            return lastId
        },
        clear() {
            storage.save('history', this.default)
        },
        load() {
            return storage.load('history', this.default)
        },
        remove(id) {
            storage.update('history', history => {
                const index = history.entries.findIndex(entry => entry.id === id)
                history.entries.splice(index, 1)
                return history
            }, this.default)
        }
    }

    class Timer {
        #resolution;
        #duration = 0;
        #startedAt = 0;
        #elapsed = 0;
        #running = false;
        #paused = false;

        constructor(tickCallback, resolution = 10) {
            this.tickCallback = tickCallback
            this.#resolution = resolution
        }

        get startedAt() {
            return this.#startedAt
        }

        get elapsed() {
            return this.#round(this.#running ? Date.now() - this.startedAt : this.#elapsed)
        }

        get remaining() {
            return this.#round(this.#remaining)
        }

        get #remaining() {
            return Math.max(0, this.#duration - this.elapsed)
        }

        get running() {
            return this.#running
        }

        get paused() {
            return this.#paused
        }

        get stopped() {
            return !this.running && !this.paused
        }

        get duration() {
            return this.#duration
        }

        get expired() {
            return this.#remaining <= 0
        }

        #round(value) {
            return Math.floor(value / this.#resolution) * this.#resolution
        }

        start(duration) {
            if (this.running || this.paused) {
                throw new Error('Timer is already running or paused')
            }

            this.#duration = duration
            this.#startedAt = Date.now()
            this.#elapsed = 0
            this.#running = true
            this.#paused = false

            this.#tick()
        }

        continue() {
            if (!this.paused) {
                if (!this.running) {
                    throw new Error('Timer is not running')
                }
                return
            }

            this.#startedAt = Date.now() - this.#elapsed
            this.#running = true
            this.#paused = false

            this.#tick()
        }

        pause() {
            if (!this.running) {
                if (!this.paused) {
                    throw new Error('Timer is not running')
                }
                return
            }

            this.#elapsed = Date.now() - this.#startedAt
            this.#running = false
            this.#paused = true
        }

        stop() {
            if (!this.running && !this.paused) {
                throw new Error('Timer is not running or paused')
            }

            if (this.running) {
                this.#elapsed = Date.now() - this.#startedAt
            }

            this.#elapsed = Math.min(this.#duration, this.#elapsed)
            this.#running = false
            this.#paused = false
        }

        #tick() {
            if (!this.running) {
                this.tickCallback(false)
                return
            }

            if (this.#remaining <= 0) {
                this.stop()
                this.tickCallback(true)
                return
            }

            this.tickCallback(false)
            requestAnimationFrame(this.#tick.bind(this))
        }
    }

    class App {
        timer = new Timer(this.updateTimer.bind(this));

        constructor() {
            this.bindEvents()
            this.loadHistory()
        }

        bindEvents() {
            elements.buttons.start().addEventListener('click', this.handleStart.bind(this))
            elements.buttons.pause().addEventListener('click', this.handlePause.bind(this))
            elements.buttons.stop().addEventListener('click', this.handleStop.bind(this))
            elements.inputs.minutes().addEventListener('input', this.handleInput.bind(this))
            elements.inputs.seconds().addEventListener('input', this.handleInput.bind(this))
            elements.buttons.clearHistory().addEventListener('click', this.handleClearHistory.bind(this))
        }

        handleStart() {
            if (!this.timer.running) {
                if (this.timer.paused) {
                    this.timer.continue()
                    this.setButtonsState('running')
                    return
                }

                const minutes = parseInt(elements.inputs.minutes().value, 10) || 0
                const seconds = parseInt(elements.inputs.seconds().value, 10) || 0
                const duration = (minutes * 60000) + (seconds * 1000)

                if (duration <= 0) {
                    alert('Please enter a valid time (minimum 1 second).')
                    return
                }

                elements.timer.display().textContent = formatTime(duration)
                elements.timer.elapsed().textContent = 'Elapsed: 00:00:00.000'

                this.setButtonsState('running')

                this.timer.start(duration)
            }
        }

        handlePause() {
            if (this.timer.running) {
                this.timer.pause()
                this.setButtonsState('paused')
            }
        }

        handleStop() {
            if (!this.timer.stopped) {
                this.timer.stop()
                this.addHistory(this.timer.remaining, this.timer.elapsed, Date.now())
                this.setButtonsState('stopped')

                elements.timer.display().textContent = formatTime(this.timer.remaining)
                elements.timer.elapsed().textContent = `Elapsed: ${formatTime(this.timer.elapsed)}`
            }
        }

        handleClearHistory() {
            if (confirm('Are you sure you want to clear the history?')) {
                this.clearHistory()
            }
        }

        handleInput() {
            const minutes = parseInt(elements.inputs.minutes().value, 10) || 0
            const seconds = parseInt(elements.inputs.seconds().value, 10) || 0
            let duration = (minutes * 60000) + (seconds * 1000)

            if (duration <= 0) {
                elements.inputs.seconds().value = '1'
                elements.inputs.minutes().value = '0'
                duration = 1000
            }

            if (!this.timer.stopped) {
                return
            }

            elements.timer.display().textContent = formatTime(duration)
        }

        updateTimer(expired) {
            if (expired) {                
                // Blink the timer display
                elements.timer.display().classList.add('expired')
                setTimeout(() => {
                    elements.timer.display().classList.remove('expired')
                }, 5000)

                // Reset buttons state
                this.setButtonsState('stopped')

                // Add to history
                this.addHistory(this.timer.remaining, this.timer.elapsed, Date.now())
            }

            elements.timer.display().textContent = formatTime(this.timer.remaining)
            elements.timer.elapsed().textContent = `Elapsed: ${formatTime(this.timer.elapsed)}`
        }

        addHistory(remaining, elapsed, timestamp) {
            const label = elements.inputs.label().value

            // Add history item to local storage
            const id = history.add(remaining, elapsed, timestamp, label)

            // Add history entry to the UI
            this.addHistoryEntry(remaining, elapsed, timestamp, label, id)
        }

        addHistoryEntry(remaining, elapsed, timestamp, label, id) {
            // Create history entry element
            const entry = components.historyEntry(remaining, elapsed, timestamp, label, id)

            // Add remove event listener
            entry.querySelector('.remove-history-entry').addEventListener('click', () => this.removeHistoryEntry(entry, id))

            // Prepend to history div
            const history = elements.history.entries()
            history.insertBefore(entry, history.firstChild)

            return entry
        }

        removeHistoryEntry(element, id) {
            history.remove(id)
            element.remove()
        }

        clearHistory() {
            history.clear()
            elements.history.entries().innerHTML = ''
        }

        loadHistory() {
            try {
                history.load().entries.forEach(entry => {
                    this.addHistoryEntry(entry.remaining, entry.elapsed, entry.timestamp, entry.label, entry.id)
                })
            } catch (e) {
                console.error('Error loading history:', e)
                this.clearHistory()
            }
        }

        setButtonsState(state) {
            switch (state) {
                case 'running':
                    elements.buttons.start().disabled = true
                    elements.buttons.pause().disabled = false
                    elements.buttons.stop().disabled = false
                    break
                case 'paused':
                    elements.buttons.start().disabled = false
                    elements.buttons.pause().disabled = true
                    elements.buttons.stop().disabled = false
                    break
                case 'stopped':
                default:
                    elements.buttons.start().disabled = false
                    elements.buttons.pause().disabled = true
                    elements.buttons.stop().disabled = true
                    break
            }

            switch (state) {
                case 'paused':
                    elements.buttons.start().textContent = 'Continue'
                    break
                default:
                    elements.buttons.start().textContent = 'Start'
                    break
            }
        }
    }

    function formatTime(ms) {
        const minutes = Math.floor(ms / 60000).toString().padStart(2, '0')
        const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
        const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0')
        return `${minutes}:${seconds}.${milliseconds}`
    }

    let app;

    document.addEventListener('DOMContentLoaded', () => {
        app = new App()
    })
})()
