# 🎤 Audio Debug Guide

## 🔍 Problem
When clicking "Listen" button, cannot hear live audio from device.

## 🛠️ Debug Steps

### 1. Check Audio System
Open `test_audio.html` in browser and test:
- Audio Context creation
- PCM audio playback
- Web Audio API functionality

### 2. Check Console Logs
Look for these messages in DevTools Console:

#### ✅ Expected Logs:
```
Audio context resumed
Audio context state: running
Received audio data, length: [number]
Playing audio buffer, size: [number]
Playing PCM audio, samples: [number]
```

#### ❌ Error Logs:
```
Web Audio API not supported
Error creating audio context
Error processing live audio
Empty audio data received
```

### 3. Check Socket Events
Monitor these socket events:

#### ✅ Expected Events:
```
Socket connected for microphone
🟢 Requesting device to start microphone stream...
📢 Listening to microphone live stream...
Received audio data, length: [number]
```

#### ❌ Missing Events:
- No `audioData` events received
- Socket not connected
- Device not responding

## 🔧 Common Issues

### 1. Audio Context Suspended
**Symptoms**: No sound, context state is 'suspended'
**Solution**: Click anywhere on page to resume audio context

### 2. No Audio Data Received
**Symptoms**: "Received audio data, length: 0"
**Causes**:
- Android app not sending audio data
- Socket connection issues
- Android permissions not granted

### 3. Audio Format Issues
**Symptoms**: "Error decoding audio"
**Solution**: Check Android app audio format (should be 16-bit PCM, 44.1kHz, mono)

### 4. Browser Audio Policy
**Symptoms**: Audio context creation fails
**Solution**: 
- Ensure HTTPS (Electron doesn't need this)
- User interaction required before audio

## 📱 Android Side Checks

### 1. Permissions
Ensure Android app has:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### 2. Audio Recording Code
Check Android app sends:
- Audio data in base64 format
- Proper audio format (16-bit PCM)
- Regular intervals (not too fast/slow)

### 3. Socket Connection
Verify Android app:
- Connects to correct server
- Sends audio data to correct event
- Maintains stable connection

## 🎯 Testing Steps

### Step 1: Test Audio System
1. Open `test_audio.html`
2. Click "Test Audio Context"
3. Click "Test PCM Audio"
4. Should hear beep sound

### Step 2: Test Microphone
1. Connect Android device
2. Open DevTools Console
3. Click "Listen" button
4. Speak into Android microphone
5. Check console logs

### Step 3: Check Data Flow
1. Monitor console for audio data
2. Check audio buffer sizes
3. Verify audio context state
4. Look for error messages

## 🔄 Audio Format Requirements

- **Sample Rate**: 44100 Hz
- **Channels**: 1 (Mono)
- **Bit Depth**: 16-bit
- **Format**: PCM (raw audio data)
- **Encoding**: Base64 for transmission

## 📞 Troubleshooting

### If No Sound:
1. Check speakers/headphones
2. Verify audio context state
3. Test with `test_audio.html`
4. Check browser audio permissions

### If No Data:
1. Check Android app logs
2. Verify socket connection
3. Check Android permissions
4. Monitor network traffic

### If Errors:
1. Check console error messages
2. Verify audio format
3. Test on different device
4. Check browser compatibility

## 🐛 Debug Commands

### Check Audio Context:
```javascript
// In DevTools Console
const ctx = new AudioContext();
console.log('State:', ctx.state);
ctx.resume();
```

### Test PCM Audio:
```javascript
// Create test audio
const ctx = new AudioContext();
const buffer = ctx.createBuffer(1, 44100, 44100);
const source = ctx.createBufferSource();
source.buffer = buffer;
source.connect(ctx.destination);
source.start(0);
```

### Monitor Socket:
```javascript
// In DevTools Console
socket.on('audioData', (data) => {
    console.log('Audio data received:', data.length);
});
``` 