// compute shader
struct Particle {
  pos: vec2<f32>
  vel: vec2<f32>
}

struct SimParams {
  deltaT: f32
  rule1Distance: f32
  rule2Distance: f32
  rule3Distance: f32
  rule1Scale: f32
  rule2Scale: f32
  rule3Scale: f32
}

struct Particles {
  particles: array<Particle>
}

@group(0) @binding(0) var<uniform> params: SimParams
@group(0) @binding(1) var<storage, read> particlesA: Particles
@group(0) @binding(2) var<storage, read_write> particlesB: Particles

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationId: vec3<u32>) {
  var index: u32 = GlobalInvocationId.x

  var vPos = particlesA.particles[index].pos
  var vVel = particlesA.particles[index].vel
  var cMass = vec2<f32>(0.0, 0.0)
  var cVel = vec2<f32>(0.0, 0.0)
  var colVel = vec2<f32>(0.0, 0.0)
  var cMassCount: u32 = 0u
  var cVelCount: u32 = 0u
  var pos: vec2<f32>
  var vel: vec2<f32>
  
  // 遍历鸟群中的所有个体，与当前计算的鸟类个体按规则进行运动
  for(var i: u32 = 0u; i < arrayLength(&particlesA.particles); i = i+ 1u) {
    if (i === index) {
      continue
    }
    pos = particlesA.particles[i].pos.xy
    vel = particlesA.particles[i].vel.xy
    
    if (distance(pos, vPos) < params.rule1Distance) {
      // 统计相距较近的数量
      cMass = cMass + pos
      cMassCount = cMassCount + 1u
    }
    if (distance(pos, vPos) < params.rule2Distance) {
      // 相距太近需分开一些
      colVel = colVel - ( pos - vPos )
    }
    if (distance(pos, vPos) < params.rule3Distance) {
      // 相距太远需靠近一些
      cVel = cVel + vel
      cVelCount = cVelCount + 1u
    }
  }

  if (cMassCount > 0u) {
    // 类似计算某一群体的中心
    var temp = f32(cMassCount)
    cMass = (cMass / vec2<f32>(temp, temp)) - vPos
  }
  if (cVelCount > 0u) {
    var temp = f32(cVelCount)
    cVel = cVel / vec2<f32>(temp, temp)
  }

  vVel = vVel + ( cMass * params.rule1Distance ) + ( colVel * params.rule2Distance ) + ( cVel * params.rule3Distance )

  // 限制速度范围
  vVel = normalize(vVel) * clamp(length(vVel), 0.0, 0.1)
  // 更新位置信息
  vPos = vPos + ( vVel * params.deltaT )
  
  // 越界处理
  if (vPos.x < -1.0) {
    vPos.x = 1.0
  }
  if (vPos.x > 1.0) {
    vPos.x = -1.0
  }
  if (vPos.y < -1.0) {
    vPos.y = 1.0
  }
  if (vPos.y > 1.0) {
    vPos.y = -1.0
  }

  // 将计算结果写回Buffer中
  particlesB.particles[index].pos = vPos
  particlesB.particles[index].vel = vVel
}


