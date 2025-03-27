/**
 * Serviço centralizado de logging
 * Fornece funcionalidades padronizadas de log em toda a aplicação
 */

// Definição de níveis de log
export const LogLevels = {
  DEBUG: { value: 0, label: 'DEBUG', color: '#808080' },
  INFO: { value: 1, label: 'INFO', color: '#0066cc' },
  WARN: { value: 2, label: 'WARN', color: '#ff9900' },
  ERROR: { value: 3, label: 'ERROR', color: '#cc0000' },
  FATAL: { value: 4, label: 'FATAL', color: '#990000' },
};

class LoggerService {
  constructor(options = {}) {
    // Nível mínimo de log (padrão: INFO em produção, DEBUG em desenvolvimento)
    this.minLevel = options.minLevel || 
      (process.env.NODE_ENV === 'production' ? LogLevels.INFO.value : LogLevels.DEBUG.value);
    
    // Habilitar/desabilitar logs no console
    this.enableConsole = options.enableConsole !== false;
    
    // Configuração de formatação
    this.timeFormat = options.timeFormat || 'HH:mm:ss';
    
    // Armazenamento de logs em memória (últimos N logs)
    this.maxMemoryLogs = options.maxMemoryLogs || 1000;
    this.memoryLogs = [];
    
    this.info('Serviço de logging inicializado');
  }
  
  /**
   * Formata uma mensagem de log
   * @param {string} level Nível do log
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   * @param {string} component Componente que originou o log
   * @returns {Object} Log formatado
   * @private
   */
  _formatLogMessage(level, message, data, component = '') {
    const timestamp = new Date();
    const formattedTime = this._formatTime(timestamp);
    
    // Determinar detalhes do nível
    const levelObj = Object.values(LogLevels).find(l => l.label === level) || LogLevels.INFO;
    
    return {
      timestamp,
      formattedTime,
      level,
      levelValue: levelObj.value,
      color: levelObj.color,
      component,
      message,
      data
    };
  }
  
  /**
   * Formata o timestamp para exibição
   * @param {Date} date Data a ser formatada
   * @returns {string} Data formatada
   * @private
   */
  _formatTime(date) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds()).substr(0, 2);
    
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
  
  /**
   * Registra uma mensagem de log
   * @param {string} level Nível do log
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   * @param {string} component Componente que originou o log
   * @private
   */
  _log(level, message, data, component = '') {
    try {
      // Formatar a mensagem
      const logEntry = this._formatLogMessage(level, message, data, component);
      
      // Verificar se deve registrar com base no nível mínimo
      if (logEntry.levelValue < this.minLevel) {
        return;
      }
      
      // Armazenar em memória
      this.memoryLogs.unshift(logEntry);
      if (this.memoryLogs.length > this.maxMemoryLogs) {
        this.memoryLogs.pop();
      }
      
      // Registrar no console se habilitado
      if (this.enableConsole) {
        const componentPrefix = component ? `[${component}] ` : '';
        const prefix = `%c${logEntry.formattedTime} ${level}${componentPrefix ? ' ' + componentPrefix : ''}`;
        
        if (data instanceof Error) {
          console[level === 'ERROR' || level === 'FATAL' ? 'error' : 
                 level === 'WARN' ? 'warn' : 
                 level === 'DEBUG' ? 'debug' : 'log'](
            prefix, `color: ${logEntry.color}; font-weight: bold`, message, data
          );
        } else if (data !== undefined) {
          console[level === 'ERROR' || level === 'FATAL' ? 'error' : 
                 level === 'WARN' ? 'warn' : 
                 level === 'DEBUG' ? 'debug' : 'log'](
            prefix, `color: ${logEntry.color}; font-weight: bold`, message, data
          );
        } else {
          console[level === 'ERROR' || level === 'FATAL' ? 'error' : 
                 level === 'WARN' ? 'warn' : 
                 level === 'DEBUG' ? 'debug' : 'log'](
            prefix, `color: ${logEntry.color}; font-weight: bold`, message
          );
        }
      }
    } catch (error) {
      // Fallback em caso de erro no log
      console.error('Erro ao registrar log:', error);
      console.error('Mensagem original:', level, message, data);
    }
  }
  
  /**
   * Registra um log de nível DEBUG
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   */
  debug(message, data) {
    this._log(LogLevels.DEBUG.label, message, data);
  }
  
  /**
   * Registra um log de nível INFO
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   */
  info(message, data) {
    this._log(LogLevels.INFO.label, message, data);
  }
  
  /**
   * Registra um log de nível WARN
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   */
  warn(message, data) {
    this._log(LogLevels.WARN.label, message, data);
  }
  
  /**
   * Registra um log de nível ERROR
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   */
  error(message, data) {
    this._log(LogLevels.ERROR.label, message, data);
  }
  
  /**
   * Registra um log de nível FATAL
   * @param {string} message Mensagem
   * @param {any} data Dados adicionais
   */
  fatal(message, data) {
    this._log(LogLevels.FATAL.label, message, data);
  }
  
  /**
   * Cria um logger específico para um componente
   * @param {string} componentName Nome do componente
   * @returns {Object} Logger do componente
   */
  createComponentLogger(componentName) {
    return {
      debug: (message, data) => this._log(LogLevels.DEBUG.label, message, data, componentName),
      info: (message, data) => this._log(LogLevels.INFO.label, message, data, componentName),
      warn: (message, data) => this._log(LogLevels.WARN.label, message, data, componentName),
      error: (message, data) => this._log(LogLevels.ERROR.label, message, data, componentName),
      fatal: (message, data) => this._log(LogLevels.FATAL.label, message, data, componentName)
    };
  }
  
  /**
   * Obtém todos os logs armazenados em memória
   * @returns {Array} Logs armazenados
   */
  getLogs() {
    return [...this.memoryLogs];
  }
  
  /**
   * Limpa todos os logs em memória
   */
  clearLogs() {
    this.memoryLogs = [];
    this.info('Logs limpos');
  }
  
  /**
   * Configura o nível mínimo de log
   * @param {number} level Nível mínimo
   */
  setMinLevel(level) {
    this.minLevel = level;
    this.info(`Nível mínimo de log alterado para ${level}`);
  }
}

// Exportar instância única
export const logger = new LoggerService();
export default logger; 