// src/services/apiService.js
import { API_URL } from '../config/api';

class ApiService {
    async uploadDocument(file, processId, tipoProcesso) {
        try {
            // Converter o arquivo para base64
            const base64Data = await this.fileToBase64(file);

            const response = await fetch(`${API_URL}/api/upload-documento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    processId,
                    documentType: tipoProcesso,
                    base64Data,
                    filename: file.name
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao fazer upload do documento');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    }

    async uploadPdf(file, processId, tipoProcesso) {
        try {
            // Converter o arquivo para base64
            const base64Data = await this.fileToBase64(file);

            const response = await fetch(`${API_URL}/api/upload-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    processId,
                    base64Data,
                    filename: file.name
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao fazer upload do PDF');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    }

    async getUploadStatus(processType, processId) {
        try {
            const response = await fetch(`${API_URL}/api/processos/${processId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao obter status de upload');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            throw error;
        }
    }

    // Função auxiliar para converter arquivo em base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}

export const apiService = new ApiService(); 