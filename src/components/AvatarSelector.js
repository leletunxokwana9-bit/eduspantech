// src/components/AvatarSelector.js
import React, { useState, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import { avatarCategories } from '../data/avatars';
import './AvatarSelector.css';

const AvatarSelector = ({ onSelect, currentAvatar, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(avatarCategories[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || null);
  const [hoveredAvatar, setHoveredAvatar] = useState(null);

  const generateAvatarSVG = (seed, style = 'adventurer') => {
    try {
      const avatar = createAvatar(adventurer, {
        seed: seed,
        size: 80,
        backgroundColor: ['#4f46e5', '#7c3aed', '#f59e0b', '#ec4899', '#06b6d4', '#10b981']
      });
      return avatar.toDataUri();
    } catch (error) {
      return null;
    }
  };

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar);
    const svg = generateAvatarSVG(avatar.seed);
    if (onSelect) {
      onSelect({
        id: avatar.id,
        name: avatar.name,
        seed: avatar.seed,
        style: avatar.style || 'adventurer',
        category: selectedCategory.id,
        svg: svg
      });
    }
  };

  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-selector-header">
          <h3>Choose Your Avatar</h3>
          <button className="avatar-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Categories */}
        <div className="avatar-categories">
          {avatarCategories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory.id === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              <span className="category-icon">{category.name.split(' ')[0]}</span>
              <span className="category-name">{category.name.replace(/[^a-zA-Z\s]/g, '').trim()}</span>
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="avatar-grid">
          {selectedCategory.avatars.map((avatar) => {
            const svg = generateAvatarSVG(avatar.seed);
            const isSelected = selectedAvatar?.id === avatar.id;
            const isHovered = hoveredAvatar === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`avatar-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => handleSelect(avatar)}
                onMouseEnter={() => setHoveredAvatar(avatar.id)}
                onMouseLeave={() => setHoveredAvatar(null)}
              >
                {svg && (
                  <img
                    src={svg}
                    alt={avatar.name}
                    className="avatar-preview"
                  />
                )}
                <span className="avatar-name">{avatar.name}</span>
                {isSelected && (
                  <span className="avatar-check">✓</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="avatar-selector-footer">
          <button className="avatar-cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="avatar-save-btn" 
            onClick={() => selectedAvatar && handleSelect(selectedAvatar)}
            disabled={!selectedAvatar}
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;