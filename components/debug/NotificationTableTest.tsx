'use client'

import { useState } from 'react'
import { NotificationService } from '@/lib/services/notificationService'
import { Button } from '@/components/ui/button'

export function NotificationTableTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)
  
  const testNotificationTable = async () => {
    setTesting(true)
    setTestResult('Testing notifications table...')
    
    try {
      const result = await NotificationService.testTableAccess()
      
      if (result.exists) {
        setTestResult('✅ Notifications table exists and is accessible!')
      } else {
        setTestResult(`❌ Notifications table not accessible. Error: ${JSON.stringify(result.error, null, 2)}`)
      }
    } catch (error) {
      setTestResult(`❌ Test failed with error: ${String(error)}`)
    } finally {
      setTesting(false)
    }
  }
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Notification Table Test</h3>
      <Button 
        onClick={testNotificationTable} 
        disabled={testing}
        size="sm"
      >
        {testing ? 'Testing...' : 'Test Notifications Table'}
      </Button>
      {testResult && (
        <pre className="mt-4 p-2 bg-white border rounded text-xs overflow-auto">
          {testResult}
        </pre>
      )}
    </div>
  )
}