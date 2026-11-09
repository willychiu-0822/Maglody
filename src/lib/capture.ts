/** 忽略較舊的權限回覆；即使 getUserMedia 無法取消，也立即關掉遲到的 stream。 */
export class CaptureGate {
  private generation = 0
  private occupied = false
  private stream?: MediaStream
  begin(): number | null {
    if (this.occupied) return null
    this.occupied = true
    return ++this.generation
  }
  accept(generation: number, stream: MediaStream): boolean {
    if (!this.current(generation)) { stream.getTracks().forEach((track) => track.stop()); return false }
    this.stream = stream
    return true
  }
  current(generation: number) { return this.occupied && generation === this.generation }
  cancel() {
    ++this.generation
    this.occupied = false
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = undefined
  }
}
