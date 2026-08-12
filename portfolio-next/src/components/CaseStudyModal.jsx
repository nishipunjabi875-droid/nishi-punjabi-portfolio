'use client';

export default function CaseStudyModal({ project, onClose }) {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" aria-label="Close modal" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        
        <div className="modal-body">
          <div className="cs-badge">{project.category}</div>
          <h2 className="cs-title">{project.title}</h2>
          
          <div className="cs-sec">
            <h4><i className="fa-solid fa-bullseye text-emerald"></i> Objective</h4>
            <p>{project.objective}</p>
          </div>

          <div className="cs-sec">
            <h4><i className="fa-solid fa-triangle-exclamation text-yellow"></i> Problem Statement</h4>
            <p>{project.problem}</p>
          </div>

          <div className="cs-sec">
            <h4><i className="fa-solid fa-chess-board text-cyan"></i> Test Strategy & Approach</h4>
            <p>{project.strategy}</p>
          </div>

          <div className="cs-sec">
            <h4><i className="fa-solid fa-vial text-purple"></i> Key Test Scenarios Covered</h4>
            <ul className="cs-list">
              {project.scenarios?.map((s, i) => (
                <li key={i}><i className="fa-solid fa-check text-green"></i> {s}</li>
              ))}
            </ul>
          </div>

          <div className="cs-sec">
            <h4><i className="fa-solid fa-screwdriver-wrench text-blue"></i> Tools & Technologies Used</h4>
            <div className="cs-tools">
              {project.tools?.map((t, i) => (
                <span key={i} className="chip">{t}</span>
              ))}
            </div>
          </div>

          <div className="cs-sec">
            <h4><i className="fa-solid fa-lightbulb text-yellow"></i> Key Findings</h4>
            <p>{project.findings}</p>
          </div>

          <div className="cs-sec cs-result-box">
            <h4><i className="fa-solid fa-circle-check text-green"></i> Result / Impact</h4>
            <p>{project.result}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
