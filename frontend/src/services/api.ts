const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
    campaigns: {
        list: () => fetch(`${API_BASE_URL}/campaigns/`).then(res => res.json()),
        create: (data: any) => fetch(`${API_BASE_URL}/campaigns/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        get: (id: string) => fetch(`${API_BASE_URL}/campaigns/${id}`).then(res => res.json()),
        update: (id: string, data: any) => fetch(`${API_BASE_URL}/campaigns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        delete: (id: string) => fetch(`${API_BASE_URL}/campaigns/${id}`, { method: 'DELETE' }).then(res => res.json())
    },
    vault: {
        list: (campaignId: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/vault`).then(res => res.json()),
        create: (campaignId: string, data: any) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/vault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        update: (campaignId: string, itemId: string, data: any) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/vault/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        delete: (campaignId: string, itemId: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/vault/${itemId}`, { method: 'DELETE' }).then(res => res.json())
    },
   sessions: {
        list: (campaignId: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/sessions`).then(res => res.json()),
        create: (campaignId: string, data?: any) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data || {})
        }).then(res => res.json()),
        get: (campaignId: string, sessionId: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/sessions/${sessionId}`).then(res => res.json()),
        update: (campaignId: string, sessionId: string, data: any) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json()),
        delete: (campaignId: string, sessionId: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/sessions/${sessionId}`, { method: 'DELETE' }).then(res => res.json())
    },
    ai: {
        ask: (campaignId: string, query: string, mode: 'vault' | 'session', sessionId?: string) => fetch(`${API_BASE_URL}/campaigns/${campaignId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, mode, sessionId })
        }).then(res => res.json())
    }
};